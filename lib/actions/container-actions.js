/** @babel */

import { authedAjax }  from '../ajax';
import dispatcher from '../app-dispatcher';

class ContainerActions {
  fetchAll() {
    const p = authedAjax({
      type: 'GET',
      url: '/api/v0/containers',
      dataType: 'json'
    });
    p.then((data) => {
      dispatcher.dispatch({
        type: 'container.fetched-all',
        data: { data }
      });
    }, (jqxhr) => {
      dispatcher.dispatch({
        type: 'container.fetch-all-failed',
        data: { jqxhr }
      });
    });
    return p;
  }
}

export default new ContainerActions();
