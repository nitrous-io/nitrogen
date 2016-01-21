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
    this.settingStoreDidChange = this.settingStoreDidChange.bind(this);
    this.handleOpenNitrogen = this.handleOpenNitrogen.bind(this);
    this.handleOpenWindow = this.handleOpenWindow.bind(this);
    this.handleQuit = this.handleQuit.bind(this);
    this.showNotification = this.showNotification.bind(this);

    const tray = this._tray = new Tray(resources.trayIcon(false, false, false));

    tray.on('clicked', function(evt, bounds) {
      tray.popUpContextMenu({ x: Math.floor(bounds.x + bounds.width / 3), y: Math.floor(bounds.y + bounds.height / 3) });
    });

    this.render();

    settingStore.onChange(this.settingStoreDidChange);
    emitter.on('show-notification', this.showNotification);
  }

  destroy() {
    settingStore.offChange(this.settingStoreDidChange);
    emitter.off('show-notification', this.showNotification);
    this._tray.destroy();
    this._tray = null;
  }

  render() {
    const tray = this._tray;

    const menu = [
      { label: 'Open Nitrogen...', click: this.handleOpenNitrogen },
      { label: 'Open Debug Window...', click: this.handleOpenWindow },
      { type: 'separator' },
      { label: 'Quit Nitrogen...', accelerator: platform.isMac ? 'Command+Q' : 'Alt+F4', click: this.handleQuit }
    ];

    tray.setContextMenu(Menu.buildFromTemplate(menu));
    tray.setToolTip('Nitrogen');

    const syncing = settingStore.isAnyContainerSyncing();
    tray.setImage(resources.trayIcon(true, false, syncing));
    tray.setPressedImage(resources.trayIcon(true, true, syncing));
  }

  settingStoreDidChange() {
    this.render();
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
    app.quit();
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
