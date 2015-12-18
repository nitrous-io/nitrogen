const path = require('path'),
      fs = require('fs'),
      platform = require('./platform');

module.exports = {
  mkdirPSync(dir, mode) {
    'use strict';
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
};
