'use strict';

const remote = require('remote'),
      path = require('path'),
      app = remote.require('app'),
      Tray = remote.require('tray'),
      Menu = remote.require('menu'),
      store = require('./store'),
      nsync = require('./nsync'),
      platform = require('../util/platform'),
      resources = require('./resources');

module.exports = class TrayMenu {
  constructor(opts) {
    opts = opts || {};
    this._resourcesPath = opts.resourcesPath;
    this._tray = new Tray(resources.trayIcon(false, false, false));
    this.render();

    store.on('change', () => {
      this.render();
    });

    nsync.on('change', () => {
      this.render();
    });
  }

  render() {
    const tray = this._tray,
          containerGroups = store.getContainersGroupedByHostId(),
          loggedIn = !!store.token,
          user = store.user;

    const menu = [];

    if (loggedIn) {
      menu.push({ label: user ? `Logged in as ${user.username}` : 'Logged in', enabled: false });
    } else {
      menu.push({ label: 'Not logged in', enabled: false });
    }

    menu.push(
      { type: 'separator' },
      { label: 'Open Window', click: this.handleOpenWindow.bind(this) },
      { type: 'separator' }
    );

    if (containerGroups.size > 0) {
      containerGroups.forEach((containers) => {
        menu.push(
          ...containers.toArray().map((container) => {
            const submenu = [
              { label: 'Open Project in Atom...', enabled: false },
              { label: 'Open Project Folder...', enabled: false }
            ];

            if (container.state === 'running') {
              submenu.push(
                { label: 'Open Shell...', enabled: false },
                { type: 'separator' },
                { label: 'Open in Web IDE...', enabled: false }
              );
            }

            if (container.state === 'running') {
              submenu.push(
                { type: 'separator' },
                {
                  type: 'submenu', label: 'File Sync',
                  icon: path.join(this._resourcesPath, 'state-green.png'),
                  submenu: [
                    { label: 'Pause Syncing', enabled: false }
                  ]
                },
                {
                  type: 'submenu', label: 'Port Forwarding',
                  icon: path.join(this._resourcesPath, 'state-green.png'),
                  submenu: [
                    { label: 'Disable Port Forwarding', enabled: false }
                  ]
                }
              );
            }

            submenu.push(
              { type: 'separator' },
              { label: `State: ${container.displayState}`, enabled: false }
            );

            return {
              type: 'submenu', label: container.displayName,
              icon: path.join(this._resourcesPath, `state-${container.stateColor}.png`),
              submenu
            };
          }),
          { type: 'separator' }
        );
      });
    }

    menu.push(
      { label: 'Quit Nitrogen/Atom', accelerator: platform.isMac ? 'Command+Q' : 'Alt+F4', click: this.handleQuit.bind(this) }
    );
    console.log(menu);

    tray.setContextMenu(Menu.buildFromTemplate(menu));
    tray.setToolTip('Nitrogen');

    tray.setImage(resources.trayIcon(nsync.ready, false, false));
    tray.setPressedImage(resources.trayIcon(nsync.ready, true, false));
  }

  handleOpenWindow() {
    remote.getCurrentWindow().show();
  }

  handleQuit() {
    app.quit();
  }
};
