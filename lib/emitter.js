'use strict';

const EventEmitter = require('events').EventEmitter;

class NitrogenEmitter extends EventEmitter {
  off(...args) {
    this.removeListener(...args);
  }
}

module.exports = new NitrogenEmitter();
