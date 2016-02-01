/** @babel */

import { authedAjax }  from '../ajax';
import dispatcher from '../app-dispatcher';

class UserActions {
  fetch() {
    const p = authedAjax({
      type: 'GET',
      url: '/api/v0/user',
      dataType: 'json',
      retry: true
    });
    p.then((data) => {
      dispatcher.dispatch({
        type: 'user.fetched',
        data: { data }
      });
    }, (jqxhr) => {
      dispatcher.dispatch({
        type: 'user.fetch-failed',
        data: { jqxhr }
      });
    });
    return p;
  }

  loginViaGithub() {
    return authedAjax({
      type: 'POST',
      url: '/api/v0/github/authorize_to_login',
      cache: false,
      data: { beta: true }
    });
  }
}

export default new UserActions();
