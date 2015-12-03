/** @babel */

import dispatcher from '../app-dispatcher';
import { ajax } from '../ajax';
import iwc from '../util/iwc';

class TokenActions {
  fetch(username, password) {
    const p = ajax({
      type: 'POST',
      url: '/api/v0/oauth/token',
      dataType: 'json',
      data: {
        grant_type: 'password',
        username,
        password
      }
    });
    p.then((data) => {
      this.dispatchToken(data.access_token);
    }, (jqxhr) => {
      dispatcher.dispatch({
        type: 'token.fetch-failed',
        data: { jqxhr }
      });
    });
    return p;
  }

  dispatchToken(token) {
    this.dispatchTokenWithoutBroadcast(token);
    iwc.send('nitrous-token.fetched', token);
  }

  dispatchTokenWithoutBroadcast(token) {
    dispatcher.dispatch({
      type: 'token.fetched',
      data: { token }
    });
  }

  invalidate(kind) {
    this.invalidateWithoutBroadcast(kind);
    iwc.send('nitrous-token.invalidate', kind);
  }

  invalidateWithoutBroadcast(kind) {
    const msg = { type: 'token.invalidate' };
    if (kind != null) {
      msg.data = { kind };
    }
    dispatcher.dispatch(msg);
  }
}

export default new TokenActions();
