'use strict';

const remote = require('remote'),
      BrowserWindow = remote.require('browser-window'),
      currentWindow = remote.getCurrentWindow(),
      app = remote.require('app');

const logger = require('./logger'),
      iwc = require('../util/iwc'),
      dialog = remote.require('dialog');

const tokenStore = require('./stores/token-store'),
      containerStore = require('./stores/container-store'),
      settingStore = require('./stores/setting-store');

const isMac = process.platform === 'darwin';

const nsyncRunner = {
  _initialized: false,

  trayMenu: null,
  nsync: null,

  init() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    // bind functions
    this.kill = this.kill.bind(this);
    this.startServer = this.startServer.bind(this);

    // bind keyboard shortcuts
    window.addEventListener('keydown', function(e) {
      // bind cmd+w / ctrl+w to hide window
      if (e.keyCode === 87 && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
        currentWindow.hide();
      }
      // bind cmd+option+i / ctrl+alt+i to open dev tools
      if (e.keyCode === 73 && e.altKey && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
        currentWindow.inspectElement(0, 0);
      }
    }, false);

    this.setupQuit();

    // set up scrollback field
    document.getElementById('nsync-log-scrollback-field').addEventListener('change', function(e) {
      let n = parseInt(e.currentTarget.value, 10);
      if (isNaN(n)) {
        n = 500;
      }
      logger.setScrollback(n);
      e.currentTarget.value = n;
    }, false);

    document.getElementById('nsync-log-clear-logs').addEventListener('click', function() {
      logger.clear();
    }, false);

    document.getElementById('nsync-log-copy-to-clipboard').addEventListener('click', function() {
      logger.copyToClipboard();
    }, false);

    // set up tray menu
    this.trayMenu = require('./tray-menu');

    // set up nsync
    this.nsync = require('./nsync');

    iwc.on('nsync-runner.start-server', this.startServer);
    iwc.on('nsync-runner.kill-server', this.kill);

    window.addEventListener('unload', () => {
      iwc.removeListener('nsync-runner.start-server', this.startServer);
      iwc.removeListener('nsync-runner.kill-server', this.kill);
      this.nsync.destroy();
      iwc.setEnv('NSYNC_RUNNER_READY', false);
    }, false);

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

  setupQuit() {
    let quitInitiated = false;

    // when quit is initiated by user from any window
    const onBeforeQuit = function() {
      quitInitiated = true;
    };
    app.on('before-quit', onBeforeQuit);

    const scheduleQuit = () => {
      const checkAndQuit = (attempts) => {
        // quit if all other windows are closed
        if (BrowserWindow.getAllWindows().length === 1) {
          this.kill();
          app.exit(0);
        } else if (attempts < 10) {
          // if not, check again after 500 millisecond
          window.setTimeout(function() {
            checkAndQuit(++attempts);
          }, 500);
        } else {
          // other windows failed to close in 5 seconds.
          // give up quitting, and show dialog
          const q = dialog.showMessageBox({
            type: 'info',
            buttons: ['Try Again', 'Cancel'],
            title: 'Nitrogen',
            message: 'The process of quitting Nitrogen application was interrupted.',
            detail: 'To try quitting Nitrogen again, click Try Again.'
          });

          if (q === 0) {
            app.quit();
          }
          return;
        }
      };
      checkAndQuit(0);
    };

    window.addEventListener('beforeunload', function(e) {
      // hide instead of closing window
      e.returnValue = false;
      currentWindow.hide();

      if (quitInitiated) {
        // quit was initiated, schedule quit
        quitInitiated = false;

        const q = dialog.showMessageBox({
          type: 'question',
          buttons: ['Run in Background', "Quit Nitrogen"],
          title: 'Run Nitrogen in Background?',
          message: 'Do you want to keep Nitrogen running in the background?',
          detail: `This will allow file sync and port forwarding to continue running. Click Nitrogen icon in the ${isMac ? 'menu bar' : 'system tray'} to access Nitrogen.`
        });
        if (q === 1) {
          scheduleQuit();
        }
      }
      return false;
    }, false);

    window.addEventListener('unload', function() {
      app.removeListener('before-quit', onBeforeQuit);
    }, false);
  }
};

module.exports = nsyncRunner;
