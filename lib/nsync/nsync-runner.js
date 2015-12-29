// this file needs to use common-js module syntax and limited ES6 because it
// is injected into nsync-runner browser window and isn't babel-compiled.

module.exports = function(nsyncRunnerPath, nodeModulesPath) {
  'use strict';

  const remote = require('remote'),
        app = remote.require('app'),
        BrowserWindow = remote.require('browser-window'),
        currentWindow = remote.getCurrentWindow();

  // if somehow, another nsync-runner window is open, close itself.
  if (BrowserWindow.getAllWindows().find((win) => {
    return (win.id !== currentWindow.id) && (win.getUrl() === 'atom://nitrogen/lib/nsync/nsync-runner.html');
  })) {
    currentWindow.close();
    return;
  }

  // hide window on close
  window.addEventListener('beforeunload', function(e) {
    currentWindow.hide();
    e.returnValue = false;
  }, false);

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

  // set up require to look at correct paths
  require.main.filename = nsyncRunnerPath;
  require.main.paths.push(nodeModulesPath);

  require('babel-polyfill');

  const logger = require('./logger');

  document.getElementById('nsync-log-scrollback-field').addEventListener('change', function(e) {
    let n = parseInt(e.currentTarget.value, 10);
    if (isNaN(n)) {
      n = 500;
    }
    logger.setScrollback(n);
    e.currentTarget.value = n;
  }, false);

  const path = require('path'),
        lockfile = require('lockfile'),
        iwc = require('../util/iwc'),
        mainProcess = remote.getGlobal('process');

  const processStartDate = new Date(+new Date() - mainProcess.uptime() * 1000).toISOString().slice(0, 10),
        lockFileName = `nitrogen-${processStartDate}-${mainProcess.pid}.lock`,
        lockPath = path.join(app.getPath('temp'), lockFileName);

  lockfile.lock(lockPath, (err) => {
    if (err) {
      currentWindow.close();
      return;
    }
    main();
  });

  function main() {
    const resources = require('./resources');
    resources.assetPath = path.join(path.dirname(nsyncRunnerPath), '..', '..', 'resources');

    const trayMenu = require('./tray-menu'),
          tokenStore = require('./stores/token-store'),
          containerStore = require('./stores/container-store'),
          settingStore = require('./stores/setting-store'),
          nsync = require('./nsync'),
          dialog = remote.require('dialog');

    window.NsyncApp = { trayMenu, nsync };

    iwc.on('nsync-runner.start-server', function(nitrousHost, authToken, folderPath) {
      tokenStore.updateToken(authToken);
      nsync.run(nitrousHost, folderPath);
    });

    const kill = function() {
      nsync.kill();
      tokenStore.reset();
      containerStore.reset();
      settingStore.reset();
      trayMenu.render();
    };

    iwc.on('nsync-runner.kill-server', function() {
      kill();
    });

    app.on('request-quit', function() {
      const q = dialog.showMessageBox({
        type: 'question',
        buttons: ['Quit', "Don't Quit"],
        title: 'Quit Nitrogen?',
        message: 'Are you sure you want to quit Nitrogen?',
        detail: 'Any unsaved changes will be lost.'
      });

      if (q === 0) {
        kill();
        app.exit(0);
      }
    });

    iwc.setEnv('NSYNC_RUNNER_READY', true);
    iwc.send('nsync-runner.ready');
  }
};
