// this code is injected into nsync-runner browser window
module.exports = function(nodeModulesPath) {
  'use strict';
  document.getElementById('nsync').textContent = "hello";

  require.main.paths.push(nodeModulesPath);

  const path = require('path'),
        lockfile = require('lockfile'),
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

    currentWindow.inspectElement(0, 0);
    currentWindow.show();
  });
};
