'use strict';

const remote = require('remote'),
      mainProcess = remote.getGlobal('process'),
      platform = require('./util/platform'),
      fileUtil = require('./util/file-util'),
      fs = require('fs'),
      path = require('path'),
      os = require('os');

let binPath = path.join(__dirname, '..', 'nsync'),
    cleanUp = function() {};

if (platform.isMac) {
  binPath = path.join(binPath, 'osx64');
} else if (platform.isWindows) {
  // on windows, copy binaries to a temp folder and execute from there
  const srcPath = path.join(binPath, 'win32');
  binPath = path.join(os.tmpdir(), `nitrogen-${mainProcess.pid}`);

  cleanUp = function() {
    try {
      fileUtil.rmRfSync(binPath);
    } catch (e) {}
  };

  fileUtil.mkdirPSync(binPath, 0o755);

  fs.readdirSync(srcPath).forEach(function(bin) {
    const destPath = path.join(binPath, bin);
    try {
      fs.statSync(destPath);
    } catch (e) {
      if (e.code === 'ENOENT') {
        fileUtil.copySync(path.join(srcPath, bin), destPath);
      } else {
        throw e;
      }
    }
  });
} else if (platform.isLinux) {
  binPath = path.join(binPath, 'lin64');
}

module.exports = {
  nsync: path.join(binPath, platform.isWindows ? 'nsync.exe' : 'nsync'),
  nsyncSsh: path.join(binPath, platform.isWindows ? 'nsync-ssh.exe' : 'nsync-ssh'),
  cleanUp
};
