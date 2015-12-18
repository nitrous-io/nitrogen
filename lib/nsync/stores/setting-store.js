'use strict';

const Store = require('./store'),
      immutable = require('immutable'),
      Setting = require('../records/setting'),
      iwc = require('../../util/iwc');

const Map = immutable.Map;

class SettingStore extends Store {
  constructor() {
    super();

    iwc.on('nsync-setting-store.get-settings', () => {
      iwc.send('nsync-setting-store.settings', this._settings.toJS());
    });
  }

  reset() {
    this._settings = Map(); // <K: containerSlug, V: Setting>
  }

  notifyChange() {
    super.notifyChange();
    iwc.send('nsync-setting-store.settings', this._settings.toJS());
  }

  updateSetting(slug, key, val) {
    const setting = this.getSetting(slug);
    this._settings = this._settings.set(slug, setting.set(key, val));
    this.notifyChange();
  }

  get settings() {
    return this._settings;
  }

  getSetting(slug) {
    if (!slug) {
      return;
    }
    let setting = this._settings.get(slug);
    if (!setting) {
      setting = new Setting();
      this._settings = this._settings.set(slug, setting);
    }
    return setting;
  }

  isAnyContainerSyncing() {
    return !!this._settings.find(function (s) {
      return s.syncState === 'syncing' || s.syncState === 'starting';
    });
  }
}

module.exports = new SettingStore();
