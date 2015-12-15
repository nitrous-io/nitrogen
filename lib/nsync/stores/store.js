'use strict';

const EventEmitter = require('events').EventEmitter;

module.exports = class Store extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {}

  notifyChange() {
    this.emit('change');
  }

  onChange(fn) {
    this.on('change', fn);
  }

  offChange(fn) {
    this.removeListener('change', fn);
  }
};
