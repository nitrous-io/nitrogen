'use strict';

const remote = require('remote'),
      currentWindow = remote.getCurrentWindow(),
      app = remote.require('app');

const logger = require('./logger'),
      iwc = require('../util/iwc'),
      dialog = remote.require('dialog');

const tokenStore = require('./stores/token-store'),
      containerStore = require('./stores/container-store'),
      settingStore = require('./stores/setting-store');

const nsyncRunner = {
  initialized: false,
  trayMenu: null,
  nsync: null,

  init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    // bind functions
    this.kill = this.kill.bind(this);
    this.startServer = this.startServer.bind(this);
    this.onRequestQuit = this.onRequestQuit.bind(this);

    // hide window when window close button is clicked
    window.addEventListener('beforeunload', function(e) {
      currentWindow.hide();
      e.returnValue = false;
    }, false);

    // bind keyboard shortcuts
    window.addEventListener('keydown', function(e) {
      const isMac = process.platform === 'darwin';
      // bind cmd+w / ctrl+w to hide window
      if (e.keyCode === 87 && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
        currentWindow.hide();
      }
      // bind cmd+option+i / ctrl+alt+i to open dev tools
      if (e.keyCode === 73 && e.altKey && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
        currentWindow.inspectElement(0, 0);
      }
    }, false);

    // set up scrollback field
    document.getElementById('nsync-log-scrollback-field').addEventListener('change', function(e) {
      let n = parseInt(e.currentTarget.value, 10);
      if (isNaN(n)) {
        n = 500;
      }
      logger.setScrollback(n);
      e.currentTarget.value = n;
    }, false);

    // set up tray menu
    this.trayMenu = require('./tray-menu');

    // set up nsync
    this.nsync = require('./nsync');

    iwc.on('nsync-runner.start-server', this.startServer);
    iwc.on('nsync-runner.kill-server', this.kill);

    app.on('request-quit', this.onRequestQuit);

    window.addEventListener('unload', () => {
      iwc.removeListener('nsync-runner.start-server', this.startServer);
      iwc.removeListener('nsync-runner.kill-server', this.kill);
      app.removeListener('request-quit', this.onRequestQuit);
      this.nsync.destroy();
      iwc.setEnv('NSYNC_RUNNER_READY', false);
    });

    iwc.setEnv('NSYNC_RUNNER_READY', true);
    iwc.send('nsync-runner.ready');

    return this;
  },

  kill() {
    this.nsync.kill();
    tokenStore.reset();
    containerStore.reset();
    settingStore.reset();
    this.trayMenu.render();
  },

  startServer(nitrousHost, authToken, folderPath) {
    tokenStore.updateToken(authToken);
    this.nsync.run(nitrousHost, folderPath);
  },

  onRequestQuit() {
    const q = dialog.showMessageBox({
      type: 'question',
      buttons: ['Quit', "Don't Quit"],
      title: 'Quit Nitrogen?',
      message: 'Are you sure you want to quit Nitrogen?',
      detail: 'Any unsaved changes will be lost.'
    });

    if (q === 0) {
      this.kill();
      app.exit(0);
    }
  }
};


module.exports = nsyncRunner;
