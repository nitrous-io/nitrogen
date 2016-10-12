/** @babel */

import Store from './store';
import snackbarActions from '../actions/snackbar-actions';
import iwc from '../util/iwc';

class TokenStore extends Store {
  _token = null;

  constructor() {
    super();
    this._token = localStorage.getItem('nitrogen:token');

    iwc.on('nitrous-token.fetched', (e, token) => {
      this._setToken(token);
      this.notifyChange();
    });

    iwc.on('nitrous-token.invalidate', () => {
      this._invalidate();
      this.notifyChange();
    });
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.fetched': {
        this._setToken(action.data.token);
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
        this._invalidate();
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  _setToken(token) {
    this._token = token;
    this._lastError = null;
    localStorage.setItem('nitrogen:token', this._token);
  }

  _invalidate() {
    this._token = null;
    this._lastError = null;
    localStorage.removeItem('nitrogen:token');
    snackbarActions.post('You have been logged out of Nitrous.', 'info');
  }

  get token() {
    return this._token;
  }
}

export default new TokenStore();
