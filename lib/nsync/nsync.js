'use strict';

const $ = require('jquery'),
      iwc = require('../util/iwc'),
      platform = require('../util/platform'),
      path = require('path'),
      logger = require('./logger'),
      tokenStore = require('./stores/token-store'),
      containerStore = require('./stores/container-store'),
      settingStore = require('./stores/setting-store'),
      emitter = require('../emitter'),
      eventsSocket = require('./socket/events-socket');

const log = logger.log,
      panic = logger.panic;

class Nsync {
  constructor() {
    this.reset();

    emitter.on('toggle-sync', this.toggleSync.bind(this));
  }

  reset() {
    this.running = false;
    this.proc = null;
    this._port = null;
    this._nitrousHost = null;
    this._folderPath = null;
  }

  run(nitrousHost, folderPath) {
    if (this.running || !tokenStore.token || !folderPath) {
      return false;
    }
    this.running = true;
    this._nitrousHost = nitrousHost;
    this._folderPath = folderPath;

    this.fetchContainers();

    this.subscribeToContainerEvents();
    this.subscribeToNsyncEvents();

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
    data = new Buffer(data).toString('utf8');
    log(data);

    data.split('\n').forEach((line) => {
      const header = "[nsync event] ";
      if (line.startsWith(header)) {
        try {
          const msg = JSON.parse(line.slice(header.length));
          emitter.emit(`nsync:${msg.name}`, msg.data);
        } catch (e) {}
      }
    });
  }

  _makeInitRequest() {
    const port = this._port;

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/init`,
      dataType: 'json',
      data: {
        host: this._nitrousHost,
        token: tokenStore.token,
        path: this._folderPath
      }
    }).then(() => {
      iwc.setEnv('NSYNC_PORT', port);
      iwc.send('nsync-runner.server-running', port);
    });
  }

  kill() {
    if (this.proc) {
      this.proc.kill();
    }
    this.reset();
    iwc.setEnv('NSYNC_PORT', '');
    iwc.send('nsync-runner.server-killed');
  }

  fetchContainers() {
    const p = $.ajax({
      type: 'GET',
      url: `${this._nitrousHost}/api/v0/containers`,
      dataType: 'json',
      headers: {
        Authorization: `Bearer ${tokenStore.token}`
      }
    });
    p.then((data) => {
      containerStore.updateContainers(data.containers);
    }, (jqxhr) => {
      panic(jqxhr);
    });
    return p;
  }

  toggleSync(containerSlug) {
    const setting = settingStore.getSetting(containerSlug),
          port = this._port;

    // flip syncState
    let enabled = false;
    if (setting.syncState === 'stopped') {
      enabled = true;
      settingStore.updateSetting(containerSlug, 'syncState', 'starting');
    } else if (setting.syncState === 'running' || setting.syncState === 'syncing') {
      enabled = false;
      settingStore.updateSetting(containerSlug, 'syncState', 'stopping');
    }

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/containers/${containerSlug}/sync/${enabled ? 'start' : 'stop'}`,
      dataType: 'json',
      data: {
        remote_path: 'code'
      }
    }).fail(() => {
      emitter.emit('show-notification', `Failed to ${enabled ? 'Enable' : 'Disable'} Sync: ${containerSlug}`);
    });
  }

  subscribeToContainerEvents() {
    eventsSocket.connect(`${this._nitrousHost}/api/v0/events`, tokenStore.token);
    [
      'events:container.starting',
      'events:container.started',
      'events:container.stopping',
      'events:container.stopped',
      'events:container.restarting',
      'events:container.restarted',
      'events:container.created',
      'events:container.destroying',
      'events:container.destroyed',
      'events:container.reconfiguring'
    ].forEach(function(evt) {
      emitter.on(evt, function(data) {
        containerStore.updateContainer(data.container.slug, data.container);
      });
    });
  }

  subscribeToNsyncEvents() {
    emitter.on('nsync:listening', (port) => {
      if (port) {
        this._port = port;
        window.setTimeout(() => {
          this._makeInitRequest();
        }, 100);
      } else {
        return panic(new Error('malformed port detected'));
      }
    });

    emitter.on('nsync:container.sync-enabled', function(data) {
      settingStore.updateSetting(data.slug, 'syncState', 'running');
      emitter.emit('show-notification', `Sync Enabled: ${data.slug}`);
    });

    emitter.on('nsync:container.sync-disabled', function(data) {
      settingStore.updateSetting(data.slug, 'syncState', 'stopped');
      emitter.emit('show-notification', `Sync Paused: ${data.slug}`);
    });

    emitter.on('nsync:container.sync-started', function(data) {
      settingStore.updateSetting(data.slug, 'syncState', 'syncing');
    });

    emitter.on('nsync:container.sync-finished', function(data) {
      settingStore.updateSetting(data.slug, 'syncState', 'running');
    });
  }
}

module.exports = new Nsync();
