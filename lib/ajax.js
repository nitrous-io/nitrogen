/** @babel */

import $ from 'jquery';
import tokenStore from './stores/token-store';
import tokenActions from './actions/token-actions';
import config from './config';


function backoff(tries, fn) {
  let timeout = 1000;
  if (tries > 5 && tries <= 10) {
    timeout = 2000;
  } else if (tries > 10) {
    timeout = 5000;
  }
  window.setTimeout(fn, timeout);
}

function ajax(options={}) {
  if (options.url) {
    options.url = config.nitrousHost + options.url;
  }

  return new Promise(function(resolve, reject) {
    let tries = 0;
    const makeRequest = function() {
      $.ajax(options).then(function(data) {
        resolve(data);
      }, function(jqxhr) {
        if (options.retry) {
          backoff(++tries, makeRequest);
          return;
        }
        let m;
        const j = jqxhr.responseJSON;
        if (j) {
          m = j.error_description || j.error;
        }
        m = m || `${jqxhr.status} ${jqxhr.statusText || 'unknown error'}`;
        jqxhr.errorMessage = m;
        reject(jqxhr);
      });
    };
    makeRequest();
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
