/** @babel */

import Store from './store';
import Org from '../records/org';
import { OrderedMap } from 'immutable';

class OrgStore extends Store {
  _orgs = OrderedMap(); // <K: org-id, V: Org>
  _fetched = false;

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._orgs = OrderedMap();
        this._fetched = false;
        this._lastError = null;
        break;
      }
      case 'org.fetched-all': {
        const { data } = action.data;
        this._orgs = OrderedMap(data.orgs.map((o) => {
          return [o.id, Org.deserialize(o)];
        }));
        this._fetched = true;
        this._lastError = null;
        break;
      }
      case 'org.fetch-all-failed': {
        this.handleErrorJqxhr(action.data.jqxhr);
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get orgs() {
    return this._orgs;
  }
}

export default new OrgStore();
