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

  get fileSyncEnabled() {
    return ['starting', 'running', 'syncing'].includes(this.syncState);
  }

  get fileSyncToggling() {
    return ['starting', 'stopping'].includes(this.syncState);
  }
}
