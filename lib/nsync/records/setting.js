'use strict';

const immutable = require('immutable');

const Record = immutable.Record,
      OrderedSet = immutable.OrderedSet;

module.exports = class Setting extends Record({
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

  serialize() {
    return JSON.stringify(this.toJS());
  }
};
