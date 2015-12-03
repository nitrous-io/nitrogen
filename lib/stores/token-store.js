/** @babel */

import Store from './store';
import snackbarActions from '../actions/snackbar-actions';

class TokenStore extends Store {
  _token = null;

  constructor() {
    super();
    this._token = localStorage.getItem('nitrogen:token');
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.fetched': {
        const { token } = action.data;
        this._token = token;
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
        snackbarActions.post('You have been logged out of Nitrous.', 'info');
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
