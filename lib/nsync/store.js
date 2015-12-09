'use strict';

const immutable = require('immutable'),
      EventEmitter = require('events').EventEmitter,
      User = require('./user'),
      Container = require('./container'),
      Setting = require('./setting'),
      Host = require('./host');

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
    this._hosts = OrderedMap(); // <K: hostId, V: Host>
    this._nsyncReady = false;
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

  updateContainerSetting(slug, key, val) {
    const setting = this.containerSetting(slug);
    this._settings = this._settings.set(slug, setting.set(key, val));
    this.notifyChange();
  }

  updateHosts(data) {
    this._hosts = OrderedMap(data.map((h) => {
      return [h.id.toString(), Host.deserialize(h)];
    }));
    this.notifyChange();
  }

  updateNsyncReady(val) {
    this._nsyncReady = val;
    this.notifyChange();
  }

  set token(t) {
    this._token = t;
    this.notifyChange();
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

  get nsyncReady() {
    return this._nsyncReady;
  }

  container(slug) {
    return this._containers.get(slug);
  }

  containerSetting(slug) {
    let setting = this._settings.get(slug);
    if (!setting) {
      setting = new Setting();
      this._settings.set(slug, setting);
    }
    return setting;
  }

  containersGroupedByHostId() {
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

  hostById(id) {
    if (id == null) {
      return;
    }
    return this._hosts.get(id.toString());
  }
}

module.exports = new Store();
