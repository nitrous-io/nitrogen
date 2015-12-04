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
      const token = data.access_token;
      dispatcher.dispatch({
        type: 'token.fetched',
        data: { token }
      });
      iwc.send('nitrous-token.fetched', token);
    }, (jqxhr) => {
      dispatcher.dispatch({
        type: 'token.fetch-failed',
        data: { jqxhr }
      });
    });
    return p;
  }

  invalidate(reason) {
    const msg = { type: 'token.invalidate' };
    if (reason != null) {
      msg.data = { reason };
    }
    dispatcher.dispatch(msg);
    iwc.send('nitrous-token.invalidate', reason);
  }
}

export default new TokenActions();
