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
      eventsSocket = require('./socket/events-socket'),
      immutable = require('immutable');

const log = logger.log,
      panic = logger.panic,
      OrderedSet = immutable.OrderedSet;

class Nsync {
  constructor() {
    this.reset();

    iwc.on('nsync.toggle-file-sync', this.toggleFileSync.bind(this));
    iwc.on('nsync.toggle-tunneling', this.toggleTunneling.bind(this));
    iwc.on('nsync.update-tunneled-ports', this.updateTunneledPorts.bind(this));
  }

  reset() {
    this._running = false;
    this._proc = null;
    this._port = null;
    this._nitrousHost = null;
    this._folderPath = null;
    this._ready = false;
  }

  run(nitrousHost, folderPath) {
    if (this._running || !tokenStore.token || !folderPath) {
      return false;
    }
    this._running = true;
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

    const proc = this._proc = childProcess.spawn(nsyncCmd, [], {
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
      this._proc = null;
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
      this._ready = true;
      iwc.setEnv('NSYNC_PORT', port);
      iwc.send('nsync-runner.server-running', port);
    });
  }

  kill() {
    if (this._proc) {
      this._proc.kill();
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

  toggleFileSync(containerSlug) {
    if (!this._ready) {
      return;
    }

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

  toggleTunneling(containerSlug) {
    if (!this._ready) {
      return;
    }

    const setting = settingStore.getSetting(containerSlug),
          port = this._port,
          enabled = !setting.tunnelingEnabled;

    if (setting.tunneledPorts.length === 0) {
      emitter.emit('show-notification', 'Please set forwarded ports before start Port forwarding');
      return;
    }

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/containers/${containerSlug}/tunnel/${enabled ? 'start' : 'stop'}`,
      dataType: 'json',
      data: {
        ports: setting.tunneledPorts.join(",")
      }
    }).fail(() => {
      emitter.emit('show-notification', `Failed to ${enabled ? 'Enable' : 'Disable'} Port forwarding: ${containerSlug}`);
    });
  }

  updateTunneledPorts(containerSlug, portSettings) {
    if (!this._ready) {
      return;
    }

    settingStore.updateSetting(containerSlug, 'tunneledPorts', OrderedSet(portSettings));
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

    emitter.on('nsync:container.started-port-forwarding', function(data) {
      settingStore.updateSetting(data.slug, 'tunnelingEnabled', true);
      emitter.emit('show-notification', `Port forwarding Enabled: ${data.slug}`);
    });

    emitter.on('nsync:container.stopped-port-forwarding', function(data) {
      settingStore.updateSetting(data.slug, 'tunnelingEnabled', false);
      emitter.emit('show-notification', `Port forwarding Disabled: ${data.slug}`);
    });
  }
}

module.exports = new Nsync();
