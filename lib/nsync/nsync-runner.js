'use strict';

const remote = require('remote'),
      BrowserWindow = remote.require('browser-window'),
      currentWindow = remote.getCurrentWindow(),
      app = remote.require('app');

const logger = require('./logger'),
      iwc = require('../util/iwc'),
      dialog = remote.require('dialog'),
      bins = require('../bins'),
      platform = require('../util/platform');

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

    // set up nsync
    this.nsync = require('./nsync');

    // set up tray menu
    this.trayMenu = require('./tray-menu');

    iwc.on('nsync-runner.start-server', this.startServer);
    iwc.on('nsync-runner.kill-server', this.kill);

    window.addEventListener('unload', () => {
      try {
        iwc.removeListener('nsync-runner.start-server', this.startServer);
        iwc.removeListener('nsync-runner.kill-server', this.kill);
        this.nsync.destroy();
        iwc.setEnv('NSYNC_RUNNER_READY', false);
      } catch (e) {}
    }, false);

    iwc.setEnv('NSYNC_RUNNER_READY', true);
    iwc.send('nsync-runner.ready');

    this.retrievePreviousSetup();
    this.initEventListners();
    return this;
  },

  kill() {
    // Nsync could not be running due to some errors
    if (this.nsync) {
      this.nsync.kill();
    }
    tokenStore.reset();
    containerStore.reset();
    settingStore.reset();
    this.trayMenu.render();
  },

  startServer(nitrousHost, authToken, folderPath) {
    tokenStore.updateToken(authToken);
    const debugEnabled = localStorage.getItem('nitrogen:nsyncDebugEnabled') === "true";
    this.nsync.run(nitrousHost, folderPath, { debug: debugEnabled });
  },

  beforeExit() {
    // overridden in nsync-runner-bootstrap
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
          try {
            this.kill();
            this.trayMenu.destroy();
          } catch (e) {}

          if (platform.isMac) {
            const Menu = remote.require('menu');

            const menu = Menu.buildFromTemplate([{
              label: app.getName(),
              submenu: [{
                label: 'Quitting Nitrogen...',
                enabled: false
              }]
            }]);

            Menu.setApplicationMenu(menu);
            app.dock.setMenu(menu);
          }

          window.setTimeout(() => {
            try {
              bins.cleanUp();
              this.beforeExit();
            } catch (e) {}
            app.exit(0);
          }, 300);
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
      try {
        app.removeListener('before-quit', onBeforeQuit);
      } catch (e) {}
    }, false);
  },

  initEventListners() {
    const nsyncLogScrollbackField = document.getElementById('nsync-log-scrollback-field');
    const nsyncDebugCheckbox = document.getElementById('nsync-enable-debug-log');
    const nsyncClearLogButton = document.getElementById('nsync-log-clear-logs');
    const nsyncCopyToClipboardButton = document.getElementById('nsync-log-copy-to-clipboard');

    nsyncLogScrollbackField.addEventListener('change', function(e) {
      let n = parseInt(e.currentTarget.value, 10);
      if (isNaN(n)) {
        n = 500;
      }
      logger.setScrollback(n);
      e.currentTarget.value = n;
      localStorage.setItem('nitrogen:nsyncLogScrollback', n);
    }, false);

    nsyncDebugCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.nsync.changeLogLevel('debug');
        localStorage.setItem('nitrogen:nsyncDebugEnabled', "true");
      } else {
        this.nsync.changeLogLevel('warn');
        localStorage.setItem('nitrogen:nsyncDebugEnabled', "false");
      }
    }, false);

    nsyncClearLogButton.addEventListener('click', function() {
      logger.clear();
    }, false);

    nsyncCopyToClipboardButton.addEventListener('click', function() {
      logger.copyToClipboard();
    }, false);
  },

  retrievePreviousSetup() {
    const nsyncLogScrollbackField = document.getElementById('nsync-log-scrollback-field');
    const nsyncDebugCheckbox = document.getElementById('nsync-enable-debug-log');

    if (localStorage.getItem('nitrogen:nsyncLogScrollback')) {
      const n = parseInt(localStorage.getItem('nitrogen:nsyncLogScrollback'), 10);
      if (!isNaN(n)) {
        nsyncLogScrollbackField.value = localStorage.getItem('nitrogen:nsyncLogScrollback');
        logger.setScrollback(n);
      }
    }

    if (localStorage.getItem('nitrogen:nsyncDebugEnabled')) {
      if (localStorage.getItem('nitrogen:nsyncDebugEnabled') === "true") {
        nsyncDebugCheckbox.checked = true;
      }
    }
  }
};

module.exports = nsyncRunner;
