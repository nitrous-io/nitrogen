/** @babel */

import Store from './store';

class TokenStore extends Store {
  _token = null;

  constructor() {
    super();
    this._token = localStorage.getItem('nitrogen:token');
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.fetched': {
        const { data } = action.data;
        this._token = data.access_token;
        this._lastError = null;
        localStorage.setItem('nitrogen:token', this._token);
        break;
      }
      case 'token.fetch-failed': {
        const { jqxhr } = action.data;
        this._token = null;
        this._lastError = jqxhr.errorMessage;
        this.handleErrorJqxhr(jqxhr);
        break;
      }
      case 'token.invalidate': {
        this._token = null;
        this._lastError = null;
        localStorage.removeItem('nitrogen:token');
        // log out
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get token() {
    return this._token;
  }
}

export default new TokenStore();
