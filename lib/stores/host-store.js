/** @babel */

import Store from './store';
import Host from '../records/host';
import { OrderedMap } from 'immutable';
import iwc from '../util/iwc';

class HostStore extends Store {
  _hosts = OrderedMap(); // <K: host-id, V: Host>
  _fetched = false;

  constructor() {
    super();
    [
      'events:host.created',
      'events:host.starting',
      'events:host.stopped',
      'events:host.create-failed',
      'events:host.updated',
      'events:host.terminated',
      'events:host.restarting',
      'events:host.stopping',
      'events:host.destroying',
      'events:host.respecced',
      'events:host.started',
      'events:host.restarted'
    ].forEach((evt) => {
      iwc.on(evt, (e, data) => {
        if (data.host) {
          const host = Host.deserialize(data.host);
          this._hosts = this._hosts.set(host.id, host);
          this.notifyChange();
        }
      });
    });
  }

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
          return [h.id, Host.deserialize(h)];
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

  getHostById(id) {
    return this.liveHosts.get(id);
  }

  get liveHosts() {
    return this._hosts.filter((h) => !h.terminatedAt);
  }

  get fetched() {
    return this._fetched;
  }

  get stoppedFreeHosts() {
    return this.liveHosts.filter((h) => {
      return h.state === 'stopped' && h.plan === 'free';
    });
  }

  get hasPaidHosts() {
    const paidHosts = this.liveHosts.filter((h) => {
      return h.plan !== 'free';
    });
    return paidHosts.size > 0;
  }
}

export default new HostStore();
