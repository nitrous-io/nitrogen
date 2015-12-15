'use strict';

const Store = require('./store');

class TokenStore extends Store {
  reset() {
    this._token = null;
  }

  updateToken(t) {
    this._token = t;
    this.notifyChange();
    return t;
  }

  get token() {
    return this._token;
  }
}

module.exports = new TokenStore();
