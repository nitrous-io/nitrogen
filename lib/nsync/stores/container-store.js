'use strict';

const Store = require('./store'),
      immutable = require('immutable'),
      Container = require('../records/container');

const Map = immutable.Map;

class ContainerStore extends Store {
  reset() {
    this._containers = Map(); // <K: containerSlug, V: Container>
  }

  updateContainers(data) {
    this._containers = Map(data.map((c) => {
      return [c.slug, Container.deserialize(c)];
    }));
    this.notifyChange();
  }

  updateContainer(slug, data) {
    const container = Container.deserialize(data);
    this._containers = this._containers.set(slug, container);
    this.notifyChange();
  }

  get containers() {
    return this._containers;
  }

  getContainer(slug) {
    return this._containers.get(slug);
  }
}

module.exports = new ContainerStore();
