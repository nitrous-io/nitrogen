'use strict';

const $ = require('jquery'),
      iwc = require('../util/iwc'),
      platform = require('../util/platform'),
      path = require('path'),
      logger = require('./logger'),
      store = require('./store'),
      emitter = require('../emitter'),
      remote = require('remote'),
      app = remote.require('app'),
      shell = remote.require('shell');

const log = logger.log,
      panic = logger.panic;

class Nsync {
  constructor() {
    this.reset();

    emitter.on('toggle-sync', this.toggleSync.bind(this));
    emitter.on('open-project-in-atom', this.openProjectInAtom.bind(this));
    emitter.on('open-project-folder', this.openProjectFolder.bind(this));
  }

  reset() {
    this.running = false;
    this.proc = null;
    this._port = null;
    this._nitrousHost = null;
    this._folderPath = null;
  }

  run(nitrousHost, folderPath) {
    if (this.running || !store.token || !folderPath) {
      return false;
    }
    this.running = true;
    this._nitrousHost = nitrousHost;
    this._folderPath = folderPath;

    this.fetchUser().then(() => {
      this.fetchHosts();
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
        this._port = port;
        this._makeInitRequest();
      } else {
        return panic(new Error('malformed port detected'));
      }
    }
  }

  _makeInitRequest() {
    const port = this._port;

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/init`,
      dataType: 'json',
      data: {
        host: this._nitrousHost,
        token: store.token,
        path: this._folderPath
      }
    }).then(() => {
      store.updateNsyncReady(true);
      iwc.setEnv('NSYNC_PORT', port);
      iwc.send('nsync-runner.server-running', port);
    });
  }

  kill() {
    this.proc.kill();
    this.reset();
    iwc.setEnv('NSYNC_PORT', '');
    iwc.send('nsync-runner.server-killed');
  }

  fetchUser() {
    const p = $.ajax({
      type: 'GET',
      url: `${this._nitrousHost}/api/v0/user`,
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
      url: `${this._nitrousHost}/api/v0/containers`,
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

  fetchHosts() {
    const p = $.ajax({
      type: 'GET',
      url: `${this._nitrousHost}/api/v0/hosts`,
      dataType: 'json',
      headers: {
        Authorization: `Bearer ${store.token}`
      }
    });
    p.then((data) => {
      store.updateHosts(data.hosts);
    }, (jqxhr) => {
      panic(jqxhr);
    });
    return p;
  }

  toggleSync(containerSlug) {
    const setting = store.containerSetting(containerSlug),
          port = this._port;

    // flip syncEnabled
    const enabled = !setting.syncEnabled;
    store.updateContainerSetting(containerSlug, 'syncEnabled', enabled);

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/containers/${containerSlug}/sync/${enabled ? 'start' : 'stop'}`,
      dataType: 'json',
      data: {
        remote_path: 'code'
      }
    }).then(() => {
      emitter.emit('show-notification', `Sync ${enabled ? 'Enabled' : 'Disabled'}: ${containerSlug}`);
    });
  }

  _getProjectPath(containerSlug) {
    const container = store.container(containerSlug);
    if (!container) {
      return;
    }
    const host = store.hostById(container.hostId);
    return host ? path.join(this._folderPath, host.slug, containerSlug) : null;
  }

  openProjectInAtom(containerSlug) {
    const dummyEvt = { preventDefault() {} },
          projectPath = this._getProjectPath(containerSlug);

    if (projectPath) {
      try {
        app.emit('open-file', dummyEvt, projectPath);
      } catch (e) {}
    }
  }

  openProjectFolder(containerSlug) {
    const dummyEvt = { preventDefault() {} },
          projectPath = this._getProjectPath(containerSlug);

    if (projectPath) {
      shell.openItem(projectPath);
    }
  }
}

module.exports = new Nsync();
