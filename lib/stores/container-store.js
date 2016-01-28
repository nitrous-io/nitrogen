/** @babel */

import Store from './store';
import Container from '../records/container';
import { OrderedMap } from 'immutable';
import iwc from '../util/iwc';

class ContainerStore extends Store {
  _containers = OrderedMap(); // <K: container-slug, V: Container>
  _sharedContainers = OrderedMap(); // <K: container-slug, V: Container>
  _fetched = false;
  _sharedFetched = false;

  constructor() {
    super();
    [
      'events:container.started',
      'events:container.restarted',
      'events:container.reconfigured',
      'events:container.reconfiguring',
      'events:container.stopping',
      'events:container.restarting',
      'events:container.destroying',
      'events:container.destroyed',
      'events:container.created',
      'events:container.starting',
      'events:container.stopped',
      'events:container.reconfigure-failed'
    ].forEach((evt) => {
      iwc.on(evt, (data) => {
        if (data.container) {
          const container = Container.deserialize(data.container);
          this._containers = this._containers.set(container.slug, container);
          this.notifyChange();
        }
      });
    });
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._containers = OrderedMap();
        this._fetched = false;
        this._sharedFetched = false;
        this._lastError = null;
        break;
      }
      case 'container.fetched-all': {
        const { data } = action.data;
        this._updateContainers(data);
        this._fetched = true;
        this._lastError = null;
        break;
      }
      case 'container.fetched-all-shared': {
        const { data } = action.data;
        this._updateContainers(data, true);
        this._sharedFetched = true;
        this._lastError = null;
        break;
      }
      case 'container.fetch-all-failed': {
        this.handleErrorJqxhr(action.data.jqxhr);
        break;
      }
      case 'container.fetch-all-shared-failed': {
        this.handleErrorJqxhr(action.data.jqxhr);
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get containers() {
    return this._containers;
  }

  getContainer(slug) {
    return this.liveContainers.get(slug);
  }

  get sharedContainers() {
    return this._sharedContainers;
  }

  get liveContainers() {
    return this._containers.filter((c) => !c.terminatedAt && c.id);
  }

  get fetched() {
    return this._fetched && this._sharedFetched;
  }

  get sharedContainersFetched() {
    return this._sharedFetched;
  }

  liveContainersByHostId(hostId) {
    return this.liveContainers.filter((c) => c.hostId === hostId);
  }

  _updateContainers(data, shared = false) {
    const containers = OrderedMap(data.containers.map((c) => {
      return [c.slug, Container.deserialize(c)];
    }));
    this._containers = this._containers.merge(containers);
    if (shared) {
      this._sharedContainers = containers;
    }
  }
}

export default new ContainerStore();
