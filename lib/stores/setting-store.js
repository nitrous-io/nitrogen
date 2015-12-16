/** @babel */

import Store from './store';
import Setting from '../records/setting';
import { Map } from 'immutable';
import iwc from '../util/iwc';

class SettingStore extends Store {
  _settings = Map(); // <K: container-slug, V: Setting>
  _fetched = false;

  constructor() {
    super();

    iwc.on('nsync-setting-store.settings', (data) => {
      const map = {};
      for (const k in data) {
        const v = data[k];
        map[k] = Setting.deserialize(v);
      }
      this._settings = Map(map);
      this._fetched = true;
      this.notifyChange();
    });

    iwc.send('nsync-setting-store.get-settings');
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._settings = Map();
        this._fetched = false;
        this._lastError = null;
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  getSetting(slug) {
    let setting = this._settings.get(slug);
    if (!setting) {
      setting = new Setting();
      this._settings = this._settings.set(slug, setting);
    }
    return setting;
  }

  get fetched() {
    return this._fetched;
  }
}

export default new SettingStore();
