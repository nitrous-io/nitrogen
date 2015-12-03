/** @babel */

import React from 'react';
import userStore from '../stores/user-store';
import Icon from './icon';

export default class NitrogenGuide extends React.Component {
  displayName = 'NitrogenGuide';

  state = {
    username: null
  };

  handleLoginBtn = () => {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'nitrogen:show-login-dialog');
  };

  componentDidMount() {
    userStore.onChange(this.userStoreDidChange);
  }

  componentWillUnmount() {
    userStore.offChange(this.userStoreDidChange);
  }

  userStoreDidChange = () => {
    this.setState({ username: userStore.user ? userStore.user.username : null });
  };

  render() {
    const { username } = this.state;

    return (
      <div className='nitrogen-guide-component nitrogen-welcome'>
        <div className='nitrogen-welcome-container'>
          <section className='nitrogen-welcome-panel'>
            <h1 className='nitrogen-welcome-title'>Get started with Nitrogen!</h1>

            <ul className='nitrogen-welcome-buttons'>
              {username ? (
                <li>
                  <button className='nitrogen-welcome-button' disabled>
                    <Icon icon='person' />
                    You&rsquo;re logged in as <strong>{username}</strong>
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

              {!username ? (
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
