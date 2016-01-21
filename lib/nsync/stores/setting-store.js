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

    this.load();
  }

  reset() {
    this._settings = Map(); // <K: containerSlug, V: Setting>
    this._loaded = false;
  }

  notifyChange() {
    super.notifyChange();
    iwc.send('nsync-setting-store.settings', this._settings.toJS());
  }

  updateSetting(slug, key, val) {
    const setting = this.getSetting(slug);
    this._settings = this._settings.set(slug, setting.set(key, val));
    this.notifyChange();
    this.save();
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

  save() {
    localStorage.setItem('nsync:setting-store', JSON.stringify(this._settings.toJS()));
  }

  load() {
    this._loaded = true;
    let data;

    try {
      data = JSON.parse(localStorage.getItem('nsync:setting-store'));
    } catch (e) {
      localStorage.removeItem('nsync:setting-store');
      return;
    }
    if (!data) {
      return;
    }

    const map = {};
    for (const k in data) {
      const v = data[k];
      if (['starting', 'running', 'syncing'].indexOf(v.syncState) !== -1) {
        v.syncState = 'running';
      } else {
        v.syncState = 'stopped';
      }
      map[k] = Setting.deserialize(v);
    }

    this._settings = Map(map);
    this.notifyChange();
  }

  get loaded() {
    return this._loaded;
  }
}

module.exports = new SettingStore();
