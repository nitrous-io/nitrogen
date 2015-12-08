'use strict';

const path = require('path'),
      platform = require('../util/platform');

module.exports = {
  assetPath: null,

  trayIcon(enabled, highlighted, syncing) {
    let image;

    if (platform.isMac) {
      if (highlighted) {
        image = `status-item-icon${syncing ? '-syncing' : '' }-highlighted.png`;
      } else {
        image = `status-item-icon${syncing && enabled ? '-syncing' : '' }${enabled ? '' : '-gray'}.png`;
      }
    } else if (platform.isWindows) {
      image = `tray-icon${syncing ? '-syncing' : '' }.ico`;
    } else {
      image = `tray-icon${syncing ? '-syncing' : '' }.png`;
    }

    return path.join(this.assetPath, image);
  }
};
