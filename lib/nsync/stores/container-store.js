'use strict';

const Store = require('./store'),
      immutable = require('immutable'),
      Container = require('../records/container');

const Map = immutable.Map;

class ContainerStore extends Store {
  reset() {
    this._containers = Map(); // <K: containerSlug, V: Container>
    this._fetched = false;
    this._sharedFetched = false;
  }

  updateContainers(data) {
    this._fetched = true;
    this._updateContainers(data);
    this.notifyChange();
  }

  updateSharedContainers(data) {
    this._sharedFetched = true;
    this._updateContainers(data);
    this.notifyChange();
  }

  updateContainer(slug, data) {
    const container = data instanceof Container ? data : Container.deserialize(data);
    this._containers = this._containers.set(slug, container);
    this.notifyChange();
  }

  get fetched() {
    return this._fetched && this._sharedFetched;
  }

  get containers() {
    return this._containers;
  }

  get liveContainers() {
    return this._containers.filter((c) => !c.terminatedAt && c.id);
  }

  getContainer(slug) {
    return this._containers.get(slug);
  }

  _updateContainers(data) {
    const containers = Map(data.map((c) => {
      return [c.slug, Container.deserialize(c)];
    }));
    this._containers = this._containers.merge(containers);
  }
}

module.exports = new ContainerStore();
