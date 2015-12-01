// this file needs to use common-js module syntax and limited ES6 because it
// is injected into nsync-runner browser window and isn't babel-compiled.

module.exports = function(nsyncRunnerPath, nodeModulesPath) {
  'use strict';

  const isMac = process.platform === 'darwin';

  window.addEventListener('error', function() {
    require('remote').getCurrentWindow().show();
  }, false);

  window.addEventListener('keydown', function(e) {
    if (e.keyCode === 73 && e.altKey && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
      require('remote').getCurrentWindow().inspectElement(0, 0);
    }
  }, false);

  // set up require to look at correct paths
  require.main.filename = nsyncRunnerPath;
  require.main.paths.push(nodeModulesPath);

  const path = require('path'),
        lockfile = require('lockfile'),
        remote = require('remote'),
        app = remote.require('app'),
        mainProcess = remote.getGlobal('process'),
        currentWindow = remote.getCurrentWindow(),
        iwc = require('./util/iwc');

  const processStartDate = new Date(+new Date() - mainProcess.uptime() * 1000).toISOString().slice(0, 10),
        lockFileName = `nitrogen-${processStartDate}-${mainProcess.pid}.lock`,
        lockPath = path.join(app.getPath('temp'), lockFileName);

  lockfile.lock(lockPath, (err) => {
    if (err) {
      currentWindow.close();
      return;
    }

    currentWindow.show();

    document.getElementById('nsync').textContent = "Nsync Runner Ready";
    iwc.send('ready');
  });
};
