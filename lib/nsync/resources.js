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
  },

  containerStateIcon(state) {
    let color = '';

    switch (state) {
      case 'running':
        color = 'green';
        break;
      case 'stopped':
        color = 'red';
        break;
      case 'terminated':
        color = 'gray';
        break;
      default:
        color = 'yellow';
    }

    return path.join(this.assetPath, `state-${color}.png`);
  },

  syncStateIcon(state) {
    let color = '';

    switch (state) {
      case 'running':
      case 'syncing':
        color = 'green';
        break;
      case 'stopped':
        color = 'red';
        break;
      default:
        color = 'yellow';
    }

    return path.join(this.assetPath, `state-${color}.png`);
  },

  boolStateIcon(bool) {
    return path.join(this.assetPath, `state-${bool ? 'green' : 'red'}.png`);
  }
};
