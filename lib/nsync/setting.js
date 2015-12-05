'use strict';

const immutable = require('immutable');

const Record = immutable.Record,
      OrderedSet = immutable.OrderedSet;

module.exports = class Setting extends Record({
  syncEnabled: false,
  tunnelingEnabled: false,
  tunneledPorts: OrderedSet()
}) {
  serialize() {
    return JSON.stringify(this.toJSON());
  }
};
