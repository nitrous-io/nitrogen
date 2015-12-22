/** @babel */

import Store from './store';
import User from '../records/user';

class UserStore extends Store {
  _user = null; // <User>

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._user = null;
        this._lastError = null;
        break;
      }
      case 'user.fetched': {
        const { data } = action.data;
        this._user = User.deserialize(data.user);
        this._lastError = null;
        break;
      }
      case 'user.fetch-failed': {
        this._user = null;
        this.handleErrorJqxhr(action.data.jqxhr);
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get user() {
    return this._user;
  }

  get username() {
    return this._user ? this._user.username : null;
  }
}

export default new UserStore();
