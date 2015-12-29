'use strict';

const remote = require('remote'),
      app = remote.require('app'),
      Tray = remote.require('tray'),
      Menu = remote.require('menu'),
      settingStore = require('./stores/setting-store'),
      platform = require('../util/platform'),
      resources = require('./resources'),
      emitter = require('../emitter');

class TrayMenu {
  constructor() {
    this._tray = new Tray(resources.trayIcon(false, false, false));
    this.render();

    settingStore.onChange(() => {
      this.render();
    });

    emitter.on('show-notification', this.showNotification.bind(this));
  }

  render() {
    const tray = this._tray;

    const menu = [
      { label: 'Open Nitrogen...', click: this.handleOpenNitrogen.bind(this) },
      { label: 'Open Debug Window...', click: this.handleOpenWindow.bind(this) },
      { type: 'separator' },
      { label: 'Quit Nitrogen...', accelerator: platform.isMac ? 'Command+Q' : 'Alt+F4', click: this.handleQuit.bind(this) }
    ];

    tray.setContextMenu(Menu.buildFromTemplate(menu));
    tray.setToolTip('Nitrogen');

    const syncing = settingStore.isAnyContainerSyncing();
    tray.setImage(resources.trayIcon(true, false, syncing));
    tray.setPressedImage(resources.trayIcon(true, true, syncing));
  }

  handleOpenNitrogen() {
    const dummyEvt = { preventDefault() {} };
    app.emit('open-file', dummyEvt);
  }

  handleOpenWindow() {
    const currentWindow = remote.getCurrentWindow();
    currentWindow.show();
    currentWindow.setMenu(null);
    currentWindow.setMenuBarVisibility(false);
  }

  handleQuit() {
    app.emit('request-quit');
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
