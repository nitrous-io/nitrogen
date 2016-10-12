// this file needs to use common-js module syntax and limited babel because it
// is injected into nsync-runner browser window and isn't babel-compiled.

module.exports = function(nsyncRunnerPath, nodeModulesPath) {
  'use strict';

  // set up require to look at correct paths
  require.main.filename = nsyncRunnerPath;
  require.main.paths.push(nodeModulesPath);

  const remote = require('electron').remote,
        BrowserWindow = remote.BrowserWindow,
        currentWindow = remote.getCurrentWindow();

  // if somehow, another nsync-runner window is open, close itself.
  if (BrowserWindow.getAllWindows().find((win) => {
    return (win.id !== currentWindow.id) && (win.getURL() === 'atom://nitrogen/lib/nsync/nsync-runner.html');
  })) {
    currentWindow.close();
    return;
  }

  const path = require('path'),
        fs = require('fs'),
        lockfile = require('lockfile'),
        app = remote.app,
        mainProcess = remote.getGlobal('process'),
        processStartDate = new Date(+new Date() - mainProcess.uptime() * 1000).toISOString().slice(0, 10),
        lockFileName = `nitrogen-${processStartDate}-${mainProcess.pid}.lock`,
        lockPath = path.join(app.getPath('temp'), lockFileName);

  // use file lock to ensure that there is only one nsync runner window
  lockfile.lock(lockPath, (err) => {
    if (err) {
      currentWindow.close();
      return;
    }

    const resources = require('./resources');
    resources.assetPath = path.join(path.dirname(nsyncRunnerPath), '..', '..', 'resources');

    window.nsyncRunner = require('./nsync-runner').init();
    window.nsyncRunner.beforeExit = function() {
      // clean up lock file
      try {
        fs.unlinkSync(lockPath);
      } catch (e) {}
    };
  });
};
