'use strict';

const remote = require('remote'),
      path = require('path'),
      Tray = remote.require('tray'),
      Menu = remote.require('menu');

module.exports = class TrayMenu {
  constructor(opts) {
    opts = opts || {};
    this._resourcesPath = opts.resourcesPath;
    this._tray = new Tray(path.join(this._resourcesPath, 'status-item-icon-gray.png'));
    this.render();
  }

  render() {
    const tray = this._tray;

    const menu = Menu.buildFromTemplate([
      { label: 'Open Window', click: this.handleOpenWindow.bind(this) }
    ]);

    tray.setContextMenu(menu);
    tray.setToolTip('Nitrogen');
  }

  handleOpenWindow() {
    remote.getCurrentWindow().show();
  }
};
