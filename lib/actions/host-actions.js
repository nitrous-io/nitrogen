/** @babel */

import { authedAjax }  from '../ajax';
import dispatcher from '../app-dispatcher';

class HostActions {
  fetchAll() {
    const p = authedAjax({
      type: 'GET',
      url: '/api/v0/hosts',
      dataType: 'json',
      retry: true
    });
    p.then((data) => {
      dispatcher.dispatch({
        type: 'host.fetched-all',
        data: { data }
      });
    }, (jqxhr) => {
      dispatcher.dispatch({
        type: 'host.fetch-all-failed',
        data: { jqxhr }
      });
    });
    return p;
  }

  start(host) {
    const p = authedAjax({
      type: 'POST',
      url: `/api/v0/hosts/${host.slug}/start`,
      dataType: 'json'
    });
    p.catch((jqxhr) => {
      dispatcher.dispatch({
        type: 'host.start-failed',
        data: { jqxhr }
      });
    });
    return p;
  }
}

export default new HostActions();
