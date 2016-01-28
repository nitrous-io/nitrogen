/** @babel */

import { authedAjax }  from '../ajax';
import dispatcher from '../app-dispatcher';

class ContainerActions {
  fetchAll() {
    const p = authedAjax({
      type: 'GET',
      url: '/api/v0/containers',
      dataType: 'json',
      retry: true
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

  fetchAllShared() {
    const p = authedAjax({
      type: 'GET',
      url: '/api/v0/shared_containers',
      dataType: 'json',
      retry: true
    });
    p.then((data) => {
      dispatcher.dispatch({
        type: 'container.fetched-all-shared',
        data: { data }
      });
    });
    p.catch((jqxhr) => {
      dispatcher.dispatch({
        type: 'container.fetch-all-shared-failed',
        data: { jqxhr }
      });
    });
    return p;
  }

  start(container) {
    const p = authedAjax({
      type: 'POST',
      url: `/api/v0/containers/${container.slug}/start`,
      dataType: 'json'
    });
    p.catch((jqxhr) => {
      dispatcher.dispatch({
        type: 'container.start-failed',
        data: { jqxhr }
      });
    });
    return p;
  }
}

export default new ContainerActions();
