/** @babel */

import React from 'react';
import tokenStore from '../stores/token-store';
import userStore from '../stores/user-store';
import Icon from './icon';

export default class NitrogenGuide extends React.Component {
  displayName = 'NitrogenGuide';

  state = {
    loggedIn: !!tokenStore.token,
    username: null
  };

  componentDidMount() {
    tokenStore.onChange(this.tokenStoreDidChange);
    userStore.onChange(this.userStoreDidChange);
  }

  componentWillUnmount() {
    tokenStore.offChange(this.tokenStoreDidChange);
    userStore.offChange(this.userStoreDidChange);
  }

  tokenStoreDidChange = () => {
    this.setState({ loggedIn: !!tokenStore.token });
  };

  userStoreDidChange = () => {
    this.setState({ username: userStore.user ? userStore.user.username : null });
  };

  handleLoginBtn = () => {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'nitrogen:show-login-dialog');
  };

  render() {
    const { loggedIn, username } = this.state;

    return (
      <div className='nitrogen-guide-component nitrogen-welcome'>
        <div className='nitrogen-welcome-container'>
          <section className='nitrogen-welcome-panel'>
            <h1 className='nitrogen-welcome-title'>Get started with Nitrogen!</h1>

            <ul className='nitrogen-welcome-buttons'>
              {loggedIn ? (
                <li>
                  <button className='nitrogen-welcome-button' disabled>
                    <Icon icon='person' />
                    You&rsquo;re logged in
                    {username ? (
                      <span> as <strong>{username}</strong></span>
                    ) : ''}
                  </button>
                </li>
              ) : (
                <li>
                  <button className='nitrogen-welcome-button primary' onClick={this.handleLoginBtn}>
                    <Icon icon='sign-in' />
                    Log in to Nitrous
                  </button>
                </li>
              )}

              {!loggedIn ? (
                <li>
                  <button className='nitrogen-welcome-button'>
                    <Icon icon='person' />
                    Create a Nitrous account
                  </button>
                </li>
              ) : ''}

              <li>
                <button className='nitrogen-welcome-button'>
                  <Icon icon='mortar-board' />
                  Open Tutorials
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    );
  }
}
