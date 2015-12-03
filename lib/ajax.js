/** @babel */

import $ from 'jquery';
import tokenStore from './stores/token-store';
import tokenActions from './actions/token-actions';

function ajax(options={}) {
  const hostname = atom.config.get('nitrogen.nitrousHost');

  if (options.url) {
    options.url = hostname + options.url;
  }

  return new Promise(function(resolve, reject) {
    $.ajax(options).then(function(data) {
      resolve(data);
    }, function(jqxhr) {
      let m;
      const j = jqxhr.responseJSON;
      if (j) {
        m = j.error_description || j.error;
      }
      m = m || `${jqxhr.status} ${jqxhr.statusText || 'unknown error'}`;
      jqxhr.errorMessage = m;
      reject(jqxhr);
    });
  });
}

function authedAjax(options={}) {
  options = Object.assign({}, options);
  options.headers = options.headers || {};
  options.headers.Authorization = `Bearer ${tokenStore.token}`;

  const promise = ajax(options);
  promise.catch((jqxhr) => {
    const { responseJSON } = jqxhr;
    if (responseJSON && responseJSON.error === 'confirmation_lapsed') {
      tokenActions.invalidate('confirmation_lapsed');
      return;
    }

    if (jqxhr.status === 401) {
      tokenActions.invalidate();
    }
  });

  return promise;
}

export default {
  ajax,
  authedAjax
};
