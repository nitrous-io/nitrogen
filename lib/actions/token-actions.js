/** @babel */

import dispatcher from '../app-dispatcher';
import { ajax } from '../ajax';
import iwc from '../util/iwc';

// this stuff is going to be public anyway so there is no point in trying to hide it
const clientId = 'EfKtIgmcUGLWxrffLfh4ZjDlDfrtnk9j',
      clientSecret = 'kGYJffNJz2HkHhffxPiOqLDi0vFT72PWPjlwtQ57YjiIcRIsnkrLwJOeNsfPw5HCjgsuZKb0KFym4fHyqNstgueyevfYBcJ4u31sj88HeuCRMC4znHtgTBf1V4nXkNlW';

class TokenActions {
  fetch(username, password) {
    const p = ajax({
      type: 'POST',
      url: '/api/v0/oauth/token',
      dataType: 'json',
      data: {
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
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
