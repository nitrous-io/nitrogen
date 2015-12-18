/** @babel */

import { authedAjax }  from '../ajax';
import dispatcher from '../app-dispatcher';

class OrgActions {
  fetchAll() {
    const p = authedAjax({
      type: 'GET',
      url: '/api/v0/orgs',
      dataType: 'json',
      retry: true
    });
    p.then((data) => {
      dispatcher.dispatch({
        type: 'org.fetched-all',
        data: { data }
      });
    }, (jqxhr) => {
      dispatcher.dispatch({
        type: 'org.fetch-all-failed',
        data: { jqxhr }
      });
    });
    return p;
  }
}

export default new OrgActions();
