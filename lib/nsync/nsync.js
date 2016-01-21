'use strict';

const $ = require('jquery'),
      iwc = require('../util/iwc'),
      path = require('path'),
      logger = require('./logger'),
      tokenStore = require('./stores/token-store'),
      containerStore = require('./stores/container-store'),
      settingStore = require('./stores/setting-store'),
      emitter = require('../emitter'),
      eventsSocket = require('./socket/events-socket'),
      immutable = require('immutable'),
      childProcess = require('child_process'),
      bins = require('../bins'),
      platform = require('../util/platform'),
      PingerSocket = require('./socket/pinger-socket');

const log = logger.log,
      panic = logger.panic,
      OrderedSet = immutable.OrderedSet,
      Map = immutable.Map;

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
    this.checkIfOldDesktopAppRunning();

    this.pingSockets = Map();

    this.toggleFileSync = this.toggleFileSync.bind(this);
    this.toggleTunneling = this.toggleTunneling.bind(this);
    this.updateTunneledPorts = this.updateTunneledPorts.bind(this);
    this.connectionDidReconnect = this.connectionDidReconnect.bind(this);
    this.registerSSHKey = this.registerSSHKey.bind(this);
    this.fetchVersion = this.fetchVersion.bind(this);
    this.ping = this.ping.bind(this);

    iwc.on('nsync.toggle-file-sync', this.toggleFileSync);
    iwc.on('nsync.toggle-tunneling', this.toggleTunneling);
    iwc.on('nsync.update-tunneled-ports', this.updateTunneledPorts);
    iwc.on('nsync.register-ssh-key', this.registerSSHKey.bind(this));
    iwc.on('nsync.fetch-version', this.fetchVersion);
    iwc.on('nsync.ping', this.ping);
    window.addEventListener('online', this.connectionDidReconnect, false);
  }

  reset() {
    this._running = false;
    this._proc = null;
    this._port = null;
    this._nitrousHost = null;
    this._folderPath = null;
    this._ready = false;
  }

  destroy() {
    this.reset();
    iwc.removeListener('nsync.toggle-file-sync', this.toggleFileSync);
    iwc.removeListener('nsync.toggle-tunneling', this.toggleTunneling);
    iwc.removeListener('nsync.update-tunneled-ports', this.updateTunneledPorts);
    iwc.removeListener('nsync.register-ssh-key', this.registerSSHKey);
    iwc.removeListener('nsync.fetch-version', this.fetchVersion);
    iwc.removeListener('nsync.ping', this.ping);
    window.removeEventListener('online', this.connectionDidReconnect, false);
  }

  fetchAll() {
    return this.fetchContainers();
  }

  connectionDidReconnect() {
    this.fetchAll();
  }

  run(nitrousHost, folderPath, options) {
    if (this._running || !tokenStore.token || !folderPath) {
      return false;
    }
    this._running = true;
    this._nitrousHost = nitrousHost;
    this._folderPath = folderPath;

    this.fetchAll().then(() => {
      this.restoreSession();
    });

    this.subscribeToEventSocketEvents();
    this.subscribeToNsyncEvents();

    log('Running Nsync...\n');

    const nsyncCmd = bins.nsync;
    const envs = {};
    if (options.debug) {
      envs['NSYNC_LOG_LEVEL'] = 'debug';
    }

    const proc = this._proc = childProcess.spawn(nsyncCmd, [], {
      cwd: path.dirname(nsyncCmd),
      env: Object.assign({}, iwc.getEnv(), envs),
      detached: false
    });

    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(evt) {
      process.on(evt, function() {
        try {
          proc.kill('SIGTERM');
        } catch (e) {}
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

  fetchVersion() {
    const nsyncCmd = bins.nsync,
          nsyncSshCmd = bins.nsyncSsh;

    let nsyncVersion = null;
    let nsyncSSHVersion = null;

    childProcess.exec(`${nsyncCmd} -v`, (error, stdout, stderr) => {
      if (error) {
        log(error.message);
        return;
      }

      if (stderr) {
        log(stderr);
      }

      nsyncVersion = stdout.trim();
      if (nsyncVersion && nsyncSSHVersion) {
        iwc.send('nsync.fetched-version', nsyncVersion, nsyncSSHVersion);
      }
    });

    childProcess.exec(`${nsyncSshCmd} -v`, (error, stdout, stderr) => {
      if (error) {
        log(error.message);
        return;
      }

      if (stderr) {
        log(stderr);
      }

      nsyncSSHVersion = stdout.trim();
      if (nsyncVersion && nsyncSSHVersion) {
        iwc.send('nsync.fetched-version', nsyncVersion, nsyncSSHVersion);
      }
    });

    return true;
  }

  checkIfOldDesktopAppRunning() {
    let cmd, output;

    if (platform.isMac) {
      cmd = 'pgrep -x Nitrous';
    } else if (platform.isWindows) {
      cmd = 'TASKLIST /fi "Imagename eq nitrous.exe"';
    } else if (platform.isLinux)  {
      cmd = 'pgrep -x nitrous';
    }

    childProcess.exec(cmd, (error, stdout, stderr) => {
      if (error) {
        // Exit code 1 is expected when there is no `Nitrous` process running
        // http://tldp.org/LDP/abs/html/exitcodes.html#EXITCODESREF
        // It succeeds to run command, but it returns some errors due to no process found
        if (error.code !== 1) {
          log(error.message);
        }
        return;
      }

      if (stderr) {
        log(stderr);
        return;
      }

      output = stdout.trim();
      if (
          // On Windows, even if process is not found, it returns output without any erros to standard output.
          // So it needs to check if it contains the command name in output.
          (platform.isWindows && output.includes('nitrous.exe')) ||
          // On MacOS or Linux, it returns pid of nitrous desktop app
          (!platform.isWindows && output.length > 0)) {
        emitter.emit('show-notification', `We have detected that you are running the Nitrous Desktop App. Please exit it before running Nitrogen`);
      }
    });
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
    containerStore.liveContainers.forEach((container, slug) => {
      const s = settingStore.getSetting(slug);

      if (container.state !== 'running') {
        // container was stopped, turn off sync and tunneling

        if (s.syncEnabled) {
          settingStore.updateSetting(slug, 'syncState', 'stopped');
        }

        if (s.tunnelingEnabled) {
          settingStore.updateSetting(slug, 'tunnelingEnabled', false);
        }
        return;
      }

      // container is running, resume file sync and tunneling
      if (s.syncEnabled) {
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

    if (setting.syncEnabled) {
      toEnable = false;
      settingStore.updateSetting(containerSlug, 'syncState', 'stopping');
    } else {
      toEnable = true;
      settingStore.updateSetting(containerSlug, 'syncState', 'starting');
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

  registerSSHKey(containerSlug) {
    if (!this._ready) {
      return;
    }

    $.ajax({
      type: 'POST',
      url: `http://127.0.0.1:${this._port}/containers/${containerSlug}/register_ssh_key`,
      dataType: 'json'
    }).done(function() {
      iwc.send('nsync.ssh-key-registered', containerSlug);
    });
  }

  changeLogLevel(logLevel) {
    $.ajax({
      type: 'PUT',
      url: `http://127.0.0.1:${this._port}/settings`,
      dataType: 'json',
      data: {log_level: logLevel}
    });
  }

  ping(containerSlug) {
    if (!this._ready) {
      return;
    }

    const container = containerStore.getContainer(containerSlug);
    if (!container) {
      log('nsync.ping: container does not exists', containerSlug);
      return;
    }

    let pingSocket = this.pingSockets.get(container.hostId);
    if  (!pingSocket) {
      pingSocket = new PingerSocket(this._nitrousHost, container.hostId, tokenStore.token);
      this.pingSockets = this.pingSockets.set(container.hostId, pingSocket);
    }

    pingSocket.ping();
  }

  subscribeToEventSocketEvents() {
    eventsSocket.connect(`${this._nitrousHost}/api/v0/events`, tokenStore.token);

    const updateContainer = function(data) {
      if (data.container) {
        containerStore.updateContainer(data.container.slug, data.container);
      }
    };

    const stopContainerTasks = (slug) => {
      if (!slug) {
        return;
      }
      const setting = settingStore.getSetting(slug);
      if (setting.tunnelingEnabled) {
        this.toggleTunneling(slug);
      }

      if (setting.syncEnabled) {
        this.toggleFileSync(slug);
      }
    };

    [
      'events:container.created',
      'events:container.starting',
      'events:container.stopped',
      'events:container.reconfigure-failed',
      'events:container.started',
      'events:container.restarted',
      'events:container.reconfigured'
    ].forEach((evt) => {
      emitter.on(evt, (data) => {
        updateContainer(data);
      });
    });

    [
      'events:container.reconfiguring',
      'events:container.stopping',
      'events:container.restarting',
      'events:container.destroying',
      'events:container.destroyed'
    ].forEach((evt) => {
      emitter.on(evt, (data) => {
        updateContainer(data);
        if (data.container) {
          stopContainerTasks(data.container.slug);
        }
      });
    });

    [
      'events:host.restarting',
      'events:host.stopping',
      'events:host.destroying'
    ].forEach(function(evt) {
      emitter.on(evt, (data) => {
        if (data.host && data.host.id) {
          const hostId = data.host.id,
                containers = containerStore.liveContainers.filter((c) => c.hostId === hostId);

          containers.forEach((container) => {
            containerStore.updateContainer(container.slug, container.set('state', 'host_stopped'));
            stopContainerTasks(container.slug);
          });
        }
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
