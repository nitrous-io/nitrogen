'use strict';

const remote = require('remote'),
      path = require('path'),
      Tray = remote.require('tray'),
      Menu = remote.require('menu'),
      store = require('./store');

module.exports = class TrayMenu {
  constructor(opts) {
    opts = opts || {};
    this._resourcesPath = opts.resourcesPath;
    this._tray = new Tray(path.join(this._resourcesPath, 'status-item-icon-gray.png'));
    this.render();

    store.on('change', () => {
      this.render();
    });
  }

  render() {
    const tray = this._tray,
          containerGroups = store.getContainersGroupedByHostId();

    let menu = [
      { label: 'Open Window', click: this.handleOpenWindow.bind(this) }
    ];

    containerGroups.forEach((containers) => {
      menu.push({ type: 'separator' });
      menu = menu.concat(containers.toArray().map((container) => {
        return { label: container.displayName, icon: path.join(this._resourcesPath, `state-${container.stateColor}.png`) };
      }));
    });

    tray.setContextMenu(Menu.buildFromTemplate(menu));
    tray.setToolTip('Nitrogen');
  }

  handleOpenWindow() {
    remote.getCurrentWindow().show();
  }
};
