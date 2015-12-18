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

function ajaxWithRetry(options) {
  const backoff = function(tries, fn) {
    let timeout = 1000;
    if (tries > 5 && tries <= 10) {
      timeout = 2000;
    } else if (tries > 10) {
      timeout = 5000;
    }
    window.setTimeout(fn, timeout);
  };

  return new Promise((resolve) => {
    let tries = 0;
    const makeRequest = () => {
      $.ajax(options).then((data) => {
        resolve(data);
      }, () => {
        backoff(++tries, makeRequest);
      });
    };
    makeRequest();
  });
}

class Nsync {
  constructor() {
    this.reset();

    iwc.on('nsync.toggle-file-sync', this.toggleFileSync.bind(this));
    iwc.on('nsync.toggle-tunneling', this.toggleTunneling.bind(this));
    iwc.on('nsync.update-tunneled-ports', this.updateTunneledPorts.bind(this));
    window.addEventListener('online', this.connectionDidReconnect.bind(this), false);
  }

  reset() {
    this._running = false;
    this._proc = null;
    this._port = null;
    this._nitrousHost = null;
    this._folderPath = null;
    this._ready = false;
  }

  fetchAll() {
    return this.fetchContainers();
  }

  connectionDidReconnect() {
    this.fetchAll();
  }

  run(nitrousHost, folderPath) {
    if (this._running || !tokenStore.token || !folderPath) {
      return false;
    }
    this._running = true;
    this._nitrousHost = nitrousHost;
    this._folderPath = folderPath;

    this.fetchAll().then(() => {
      this.restoreSession();
    });

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

    log('Running Nsync...\n');

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

    const p = ajaxWithRetry({
      type: 'POST',
      url: `http://127.0.0.1:${port}/init`,
      dataType: 'json',
      data: {
        host: this._nitrousHost,
        token: tokenStore.token,
        path: this._folderPath
      }
    });
    p.then(() => {
      this._ready = true;
      iwc.setEnv('NSYNC_PORT', port);
      this.restoreSession();
      iwc.send('nsync-runner.server-running', port);
    });
    return p;
  }

  restoreSession() {
    if (!(containerStore.fetched && settingStore.loaded && this._ready)) {
      return;
    }
    // restores previous nsync settings
    containerStore.containers.forEach((_, slug) => {
      const s = settingStore.getSetting(slug);
      if (s.syncState === 'running') {
        // start sync
        settingStore.updateSetting(slug, 'syncState', 'starting');
        this.makeFileSyncRequest(slug, true, 'stopped');
      }

      if (s.tunnelingEnabled) {
        // start tunneling
        this.makeTunnelingRequest(slug, true);
      }
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
    const p = ajaxWithRetry({
      type: 'GET',
      url: `${this._nitrousHost}/api/v0/containers`,
      dataType: 'json',
      headers: {
        Authorization: `Bearer ${tokenStore.token}`
      }
    });
    p.then((data) => {
      containerStore.updateContainers(data.containers);
    });
    return p;
  }

  makeFileSyncRequest(containerSlug, enable, previousSyncState) {
    const port = this._port;

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/containers/${containerSlug}/sync/${enable ? 'start' : 'stop'}`,
      dataType: 'json',
      data: {
        remote_path: 'code'
      }
    }).fail(function() {
      settingStore.updateSetting(containerSlug, 'syncState', previousSyncState);
      emitter.emit('show-notification', `Failed to ${enable ? 'Enable' : 'Disable'} Sync: ${containerSlug}`);
    });
  }

  toggleFileSync(containerSlug) {
    if (!this._ready) {
      return;
    }

    const setting = settingStore.getSetting(containerSlug);

    // flip syncState
    let toEnable = false;
    const originalSyncState = setting.syncState;
    if (originalSyncState === 'stopped') {
      toEnable = true;
      settingStore.updateSetting(containerSlug, 'syncState', 'starting');
    } else if (originalSyncState === 'running' || originalSyncState === 'syncing') {
      toEnable = false;
      settingStore.updateSetting(containerSlug, 'syncState', 'stopping');
    }

    this.makeFileSyncRequest(containerSlug, toEnable, originalSyncState);
  }

  makeTunnelingRequest(containerSlug, enable) {
    const port = this._port;

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${port}/containers/${containerSlug}/tunnel/${enable ? 'start' : 'stop'}`,
      dataType: 'json',
      data: {
        ports: settingStore.getSetting(containerSlug).tunneledPorts.join(',')
      }
    }).fail(function() {
      settingStore.updateSetting(containerSlug, 'tunnelingEnabled', !enable);
      emitter.emit('show-notification', `Failed to ${enable ? 'Enable' : 'Disable'} Port Forwarding: ${containerSlug}`);
    });
  }

  toggleTunneling(containerSlug) {
    if (!this._ready) {
      return;
    }

    const setting = settingStore.getSetting(containerSlug),
          toEnable = !setting.tunnelingEnabled;

    if (toEnable && setting.tunneledPorts.size === 0) {
      emitter.emit('show-notification', 'Port forwarding is not configured');
      return;
    }

    settingStore.updateSetting(containerSlug, 'tunnelingEnabled', toEnable);
    this.makeTunnelingRequest(containerSlug, toEnable);
  }

  updateTunneledPorts(containerSlug, portSettings) {
    if (!this._ready) {
      return;
    }

    settingStore.updateSetting(containerSlug, 'tunneledPorts', OrderedSet(portSettings));

    if (settingStore.getSetting(containerSlug).tunnelingEnabled) {
      this.makeTunnelingRequest(containerSlug, true);
    }
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

    emitter.on('nsync:container.started-port-forwarding', function(data) {
      settingStore.updateSetting(data.slug, 'tunnelingEnabled', true);
      emitter.emit('show-notification', `Port Forwarding Started: ${data.slug}`);
    });

    emitter.on('nsync:container.stopped-port-forwarding', function(data) {
      settingStore.updateSetting(data.slug, 'tunnelingEnabled', false);
      emitter.emit('show-notification', `Port Forwarding Disabled: ${data.slug}`);
    });
  }
}

module.exports = new Nsync();
