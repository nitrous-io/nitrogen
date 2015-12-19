/** @babel */

import { Record, OrderedSet } from 'immutable';

export default class Setting extends Record({
  syncState: 'stopped', // stopped, starting, running, syncing, stopping
  tunnelingEnabled: false,
  tunneledPorts: OrderedSet()
}) {
  static deserialize(p) {
    return new this({
      syncState: p.syncState,
      tunnelingEnabled: p.tunnelingEnabled,
      tunneledPorts: OrderedSet(p.tunneledPorts)
    });
  }

  get syncEnabled() {
    return ['starting', 'running', 'syncing'].includes(this.syncState);
  }

  get syncToggling() {
    return ['starting', 'stopping'].includes(this.syncState);
  }
}
