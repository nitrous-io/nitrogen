// this file needs to use common-js module syntax and limited ES6 because it
// is injected into nsync-runner browser window and isn't babel-compiled.

module.exports = function(nsyncRunnerPath, nodeModulesPath) {
  'use strict';

  const remote = require('remote'),
        app = remote.require('app'),
        currentWindow = remote.getCurrentWindow();

  // show window on error
  window.addEventListener('error', function() {
    currentWindow.show();
  }, false);

  // allow window to be closed if user is attempting to quit
  let shouldQuit = false;
  app.on('before-quit', function() {
    shouldQuit = true;
  });

  // hide window on close
  window.addEventListener('beforeunload', function(e) {
    if (!shouldQuit) {
      currentWindow.hide();
      e.returnValue = false;
    }
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

  require('babel/polyfill');

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
          store = require('./store'),
          nsync = require('./nsync');

    window.NsyncApp = { trayMenu, nsync };

    iwc.on('nsync-runner.start-server', function(nitrousHost, authToken, folderPath) {
      store.token = authToken;
      nsync.run(nitrousHost, folderPath);
    });

    iwc.on('nsync-runner.kill-server', function() {
      nsync.kill();
      store.reset();
      trayMenu.render();
    });

    iwc.setEnv('NSYNC_RUNNER_READY', true);
    iwc.send('nsync-runner.ready');

    currentWindow.show();
    currentWindow.setMenu(null);
    currentWindow.setMenuBarVisibility(false);
  }
};
