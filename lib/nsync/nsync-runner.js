'use strict';
// this file needs to use common-js module syntax and limited ES6 because it
// is injected into nsync-runner browser window and isn't babel-compiled.

module.exports = function(nsyncRunnerPath, nodeModulesPath) {
  // show window on error
  window.addEventListener('error', function() {
    require('remote').getCurrentWindow().show();
  }, false);

  // bind cmd+option+i / ctrl+alt+i to open dev tools
  window.addEventListener('keydown', function(e) {
    const isMac = process.platform === 'darwin';
    if (e.keyCode === 73 && e.altKey && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
      require('remote').getCurrentWindow().inspectElement(0, 0);
    }
  }, false);

  // set up require to look at correct paths
  require.main.filename = nsyncRunnerPath;
  require.main.paths.push(nodeModulesPath);

  require('babel/polyfill');

  const path = require('path'),
        lockfile = require('lockfile'),
        iwc = require('../util/iwc'),
        remote = require('remote'),
        app = remote.require('app'),
        mainProcess = remote.getGlobal('process'),
        currentWindow = remote.getCurrentWindow();

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
    const Nsync = require('./nsync');

    currentWindow.show();

    iwc.setEnv('NSYNC_RUNNER_READY', true);
    iwc.send('nsync-runner.ready');

    const nsync = new Nsync();

    iwc.on('nsync-runner.start-server', function(nitrousHost, authToken, folderPath) {
      nsync.run(nitrousHost, authToken, folderPath);
    });

    iwc.on('nsync-runner.kill-server', function() {
      nsync.kill();
    });
  }
};
