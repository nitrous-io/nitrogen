/** @babel */

import React, { PropTypes } from 'react';
import URL from 'url';

import dispatcher from '../app-dispatcher';
import config from '../config';

const loginUrl = 'app/#/login';

export default class NitrogenGitHubLogin extends React.Component {
  displayName = 'NitrogenGitHubLogin';

  static propTypes = {
    url: PropTypes.string
  };

  componentDidMount() {
    const { url } = this.props,
          { webview } = this.refs;

    webview.addEventListener('did-get-redirect-request', this.onRedirect, false);
    this.refs.webview.src = url;
  }

  onRedirect = (e) => {
    if (e.newUrl.startsWith(`${config.nitrousHost}/${loginUrl}`)) {
      const url = URL.parse(e.newUrl.replace('/#', ''), true),
            token = url.query['token'];

      if (token) {
        dispatcher.dispatch({
          type: 'token.fetched',
          data: { token }
        });
      }
    }
  }

  render() {
    return (
      <div className='nitrogen-github-login-component'>
        <webview ref='webview' className='native-key-bindings' autosize="on" allowpopups />
      </div>
    );
  }
}

