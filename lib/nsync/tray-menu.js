'use strict';

const remote = require('remote'),
      app = remote.require('app'),
      Tray = remote.require('tray'),
      Menu = remote.require('menu'),
      store = require('./store'),
      platform = require('../util/platform'),
      resources = require('./resources'),
      emitter = require('../emitter');

class TrayMenu {
  constructor() {
    this._tray = new Tray(resources.trayIcon(false, false, false));
    this.render();

    store.on('change', () => {
      this.render();
    });

    emitter.on('show-notification', this.showNotification.bind(this));
  }

  render() {
    const tray = this._tray,
          containerGroups = store.containersGroupedByHostId(),
          loggedIn = !!store.token,
          user = store.user,
          nsyncReady = store.nsyncReady;

    const menu = [];

    if (loggedIn) {
      menu.push({ label: user ? `Logged in as ${user.username}` : 'Logged in', enabled: false });
    } else {
      menu.push({ label: 'Not logged in', enabled: false });
    }

    menu.push(
      { type: 'separator' },
      { label: 'Open Debug Window', click: this.handleOpenWindow.bind(this) },
      { type: 'separator' }
    );

    if (containerGroups.size > 0) {
      containerGroups.forEach((containers, hostId) => {
        const host = store.hostById(hostId);
        if (host) {
          menu.push({ label: host.displayName, enabled: false });
        }
        menu.push(
          ...containers.toArray().map((container) => {
            const setting = store.containerSetting(container.slug),
                  submenu = [];

            submenu.push(
              {
                label: 'Open Project in Atom...',
                enabled: !!host,
                click: () => {
                  this.handleOpenProjectInAtom(container.slug);
                }
              },
              {
                label: 'Open Project Folder...',
                enabled: !!host,
                click: () => {
                  this.handleOpenProjectFolder(container.slug);
                }
              }
            );

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
                  icon: resources.boolStateIcon(setting.syncEnabled),
                  submenu: [
                    {
                      label: setting.syncEnabled ? 'Pause Syncing' : 'Start Syncing',
                      click: () => {
                        this.handleToggleSync(container.slug);
                      }
                    }
                  ]
                },
                {
                  type: 'submenu', label: 'Port Forwarding',
                  icon: resources.boolStateIcon(false),
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
              icon: resources.containerStateIcon(container.state),
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

    tray.setContextMenu(Menu.buildFromTemplate(menu));
    tray.setToolTip('Nitrogen');

    tray.setImage(resources.trayIcon(nsyncReady, false, false));
    tray.setPressedImage(resources.trayIcon(nsyncReady, true, false));
  }

  handleOpenWindow() {
    remote.getCurrentWindow().show();
  }

  handleQuit() {
    app.quit();
  }

  handleToggleSync(containerSlug) {
    emitter.emit('toggle-sync', containerSlug);
  }

  handleOpenProjectInAtom(containerSlug) {
    emitter.emit('open-project-in-atom', containerSlug);
  }

  handleOpenProjectFolder(containerSlug) {
    emitter.emit('open-project-folder', containerSlug);
  }

  showNotification(content) {
    const title = 'Nitrogen';

    if (platform.isWindows) {
      this._tray.displayBalloon({ title, content });
    } else {
      Notification.requestPermission(function(perm) {
        if (perm === 'granted') {
          new Notification(title, { body: content });
        }
      });
    }
  }
}

module.exports = new TrayMenu();
