'use strict';

const path = require('path'),
      fs = require('fs'),
      platform = require('./platform');

function mkdirPSync(dir, mode) {
  const pathComps = dir.split(path.sep);
  let i = 0;
  for (i = 0; i < pathComps.length; i++) {
    const p = pathComps.slice(0, i+1).join(path.sep);
    if (p === '' || (platform.isWindows && p.endsWith(':'))) {
      // root - skip
      continue;
    }
    try {
      fs.mkdirSync(p, mode);
    } catch (e) {
      if (e.code === 'EEXIST') {
        continue;
      }
      throw e;
    }
  }
}

function copySync(src, dest) {
  const bufSize = 65536,
        buf = new Buffer(bufSize);

  let bytesRead = 0,
      pos = 0;

  let srcFd, destFd;

  try {
    srcFd = fs.openSync(src, 'r');
    const srcStat = fs.fstatSync(srcFd);
    destFd = fs.openSync(dest, 'w', srcStat.mode);

    do {
      bytesRead = fs.readSync(srcFd, buf, 0, bufSize, pos);
      fs.writeSync(destFd, buf, 0, bytesRead);
      pos += bytesRead;
    } while (bytesRead > 0);

  } finally {
    if (srcFd) {
      fs.closeSync(srcFd);
    }
    if (destFd) {
      fs.closeSync(destFd);
    }
  }
}

function rmRfSync(dir) {
  fs.readdirSync(dir).forEach(function(f) {
    f = path.join(dir, f);
    const stat = fs.lstatSync(f);
    if (stat.isDirectory()) {
      rmRfSync(f);
    } else {
      fs.unlinkSync(f);
    }
  });
  fs.rmdirSync(dir);
}

module.exports = {
  mkdirPSync,
  copySync,
  rmRfSync
};
