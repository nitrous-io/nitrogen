'use strict';

const immutable = require('immutable'),
      EventEmitter = require('events').EventEmitter,
      Container = require('./container');

const OrderedMap = immutable.OrderedMap,
      Map = immutable.Map;

class Store extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this._containers = OrderedMap(); // <K: containerSlug, V: Container>
    this._settings = Map(); // <K: containerSlug, V: Setting>
  }

  notifyChange() {
    this.emit('change');
  }

  updateContainers(data) {
    this._containers = OrderedMap(data.map((c) => {
      return [c.slug, Container.deserialize(c)];
    }));
  }

  get containers() {
    return this._containers;
  }

  get settings() {
    return this._settings;
  }
}

module.exports = new Store();
