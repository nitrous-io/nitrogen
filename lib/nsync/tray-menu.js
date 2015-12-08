'use strict';

const remote = require('remote'),
      path = require('path'),
      app = remote.require('app'),
      Tray = remote.require('tray'),
      Menu = remote.require('menu'),
      store = require('./store'),
      platform = require('../util/platform');

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
          containerGroups = store.getContainersGroupedByHostId(),
          loggedIn = !!store.token;

    let menu = [
      { label: 'Open Window', click: this.handleOpenWindow.bind(this) }
    ];

    if (containerGroups.size > 0) {
      containerGroups.forEach((containers) => {
        menu.push({ type: 'separator' });
        menu = menu.concat(containers.toArray().map((container) => {
          return { label: container.displayName, icon: path.join(this._resourcesPath, `state-${container.stateColor}.png`) };
        }));
      });
    } else if (loggedIn) {
      menu = menu.concat([
        { type: 'separator' },
        { label: 'Loading containers...', enabled: false }
      ]);
    }

    menu = menu.concat([
      { type: 'separator' },
      { label: 'Quit Nitrogen', accelerator: platform.isMac ? 'Command+Q' : 'Alt+F4', click: this.handleQuit.bind(this) }
    ]);

    tray.setContextMenu(Menu.buildFromTemplate(menu));
    tray.setToolTip('Nitrogen');
  }

  handleOpenWindow() {
    remote.getCurrentWindow().show();
  }

  handleQuit() {
    app.quit();
  }
};
