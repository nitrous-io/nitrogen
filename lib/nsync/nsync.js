'use strict';

const EventEmitter = require('events').EventEmitter,
      $ = require('jquery'),
      iwc = require('../util/iwc'),
      platform = require('../util/platform'),
      path = require('path'),
      logger = require('./logger'),
      store = require('./store');

const log = logger.log,
      panic = logger.panic;

class Nsync extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.running = false;
    this._ready = false;
    this.proc = null;
    this.port = null;
    this.nitrousHost = null;
    this.folderPath = null;
  }

  run(nitrousHost, folderPath) {
    if (this.running || !store.token || !folderPath) {
      return false;
    }
    this.running = true;
    this.nitrousHost = nitrousHost;
    this.folderPath = folderPath;

    this.fetchUser().then(() => {
      this.fetchContainers();
    });

    const childProcess = require('child_process');
    let nsyncCmd = path.join(__dirname, '..', '..', 'nsync');

    if (platform.isMac) {
      nsyncCmd = path.join(nsyncCmd, 'osx64', 'nsync');
    } else if (platform.isWindows) {
      nsyncCmd = path.join(nsyncCmd, 'win32', 'nsync.exe');
    } else if (platform.isLinux) {
      nsyncCmd = path.join(nsyncCmd, 'lin64', 'nsync');
    } else {
      return panic(new Error("unsupported platform"));
    }

    log('\nRunning Nsync...\n');

    const proc = this.proc = childProcess.spawn(nsyncCmd, [], {
      cwd: path.dirname(nsyncCmd),
      env: iwc.getEnv(),
      detached: false
    });

    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(evt) {
      process.on(evt, function() {
        proc.kill('SIGTERM');
      });
    });

    proc.on('close', (code) => {
      log(`\nProcess exited with code ${code}`);
      this.proc = null;
    });

    proc.stdout.on('data', this._handleOutput.bind(this));
    proc.stderr.on('data', this._handleOutput.bind(this));

    return true;
  }

  _handleOutput(data) {
    const atoi = require('../util/string-util').atoi;

    data = new Buffer(data).toString('utf8');
    log(data);

    const match = data.match(/Nsync ready at port (\d+)/m);
    if (match) {
      const port = atoi(match[1]);
      if (port) {
        this.port = port;
        this._makeInitRequest();
      } else {
        return panic(new Error('malformed port detected'));
      }
    }
  }

  _makeInitRequest() {
    const port = this.port;

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/init`,
      dataType: 'json',
      data: {
        host: this.nitrousHost,
        token: store.token,
        path: this.folderPath
      }
    }).then(() => {
      this._ready = true;
      iwc.setEnv('NSYNC_PORT', port);
      iwc.send('nsync-runner.server-running', port);
      this.notifyChange();
    });
  }

  kill() {
    this.proc.kill();
    this.reset();
    iwc.setEnv('NSYNC_PORT', '');
    iwc.send('nsync-runner.server-killed');
  }

  notifyChange() {
    this.emit('change');
  }

  fetchUser() {
    const p = $.ajax({
      type: 'GET',
      url: `${this.nitrousHost}/api/v0/user`,
      dataType: 'json',
      headers: {
        Authorization: `Bearer ${store.token}`
      }
    });
    p.then((data) => {
      store.updateUser(data.user);
    }, (jqxhr) => {
      panic(jqxhr);
    });
    return p;
  }

  fetchContainers() {
    const p = $.ajax({
      type: 'GET',
      url: `${this.nitrousHost}/api/v0/containers`,
      dataType: 'json',
      headers: {
        Authorization: `Bearer ${store.token}`
      }
    });
    p.then((data) => {
      store.updateContainers(data.containers);
    }, (jqxhr) => {
      panic(jqxhr);
    });
    return p;
  }

  get ready() {
    return this._ready;
  }
}

module.exports = new Nsync();
