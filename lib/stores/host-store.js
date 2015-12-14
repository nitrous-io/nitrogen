/** @babel */

import Store from './store';
import Host from '../records/host';
import { OrderedMap } from 'immutable';

class HostStore extends Store {
  _hosts = OrderedMap(); // <K: host-id, V: Host>
  _fetched = false;

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._hosts = OrderedMap();
        this._fetched = false;
        this._lastError = null;
        break;
      }
      case 'host.fetched-all': {
        const { data } = action.data;
        this._hosts = OrderedMap(data.hosts.map((h) => {
          return [h.slug, Host.deserialize(h)];
        }));
        this._fetched = true;
        this._lastError = null;
        break;
      }
      case 'host.fetch-all-failed': {
        this.handleErrorJqxhr(action.data.jqxhr);
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get hosts() {
    return this._hosts;
  }

  get liveHosts() {
    return this._hosts.filter((h) => !h.terminatedAt);
  }

  get fetched() {
    return this._fetched;
  }
}

export default new HostStore();
