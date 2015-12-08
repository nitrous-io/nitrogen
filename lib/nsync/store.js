'use strict';

const immutable = require('immutable'),
      EventEmitter = require('events').EventEmitter,
      User = require('./user'),
      Container = require('./container');

const OrderedMap = immutable.OrderedMap,
      OrderedSet = immutable.OrderedSet,
      Map = immutable.Map;

class Store extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this._token = null; // auth token
    this._user = null; // User
    this._containers = OrderedMap(); // <K: containerSlug, V: Container>
    this._settings = Map(); // <K: containerSlug, V: Setting>
  }

  notifyChange() {
    this.emit('change');
  }

  updateUser(data) {
    this._user = User.deserialize(data);
    this.notifyChange();
  }

  updateContainers(data) {
    this._containers = OrderedMap(data.map((c) => {
      return [c.slug, Container.deserialize(c)];
    }));
    this.notifyChange();
  }

  set token(t) {
    this._token = t;
    return t;
  }

  get token() {
    return this._token;
  }

  get user() {
    return this._user;
  }

  get containers() {
    return this._containers;
  }

  get settings() {
    return this._settings;
  }

  getContainersGroupedByHostId() {
    const groups = {};

    this._containers.forEach(function(container) {
      if (container.hostId) {
        var group = groups[container.hostId] || OrderedSet();
        group = group.add(container);
        groups[container.hostId] = group;
      }
    });

    return Map(groups);
  }
}

module.exports = new Store();
