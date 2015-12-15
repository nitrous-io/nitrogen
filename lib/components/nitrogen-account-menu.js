/** @babel */

import React from 'react';
import tokenActions from '../actions/token-actions';
import tokenStore from '../stores/token-store';
import userStore from '../stores/user-store';
import Icon from './icon';
import NitrogenDropdown from './nitrogen-dropdown';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';

export default class NitrogenAccountMenu extends React.Component {
  displayName = 'NitrogenAccountMenu';

  state = {
    loggedIn: !!tokenStore.token,
    user: userStore.user
  };

  componentDidMount() {
    tokenStore.onChange(this.tokenStoreDidChange);
    userStore.onChange(this.userStoreDidChange);
  }

  componentWillUnmount() {
    tokenStore.offChange(this.tokenStoreDidChange);
    userStore.offChange(this.userStoreDidChange);
  }

  userStoreDidChange = () => {
    this.setState({ user: userStore.user });
  };

  tokenStoreDidChange = () => {
    this.setState({ loggedIn: !!tokenStore.token });
  };

  handleClickLoginBtn = () => {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'nitrogen:show-login-dialog');
  };

  handleClickLogout = () => {
    tokenActions.invalidate('logout');
  };

  render() {
    const { loggedIn, user } = this.state;

    return (
      <div className='nitrogen-account-menu-component'>
        {loggedIn ? (
          <NitrogenDropdown toggleButton={
            <div className='account'>
              <div className='gravatar' style={{ backgroundImage: user ? `url(${user.gravatar(24*2)})` : 'none' }} />
            </div>
          }>
            <NitrogenDropdownMenuItem disabled>
              {user ? `Logged in as ${user.username}` : 'Logged In'}
            </NitrogenDropdownMenuItem>
            <NitrogenDropdownMenuItem separator />
            <NitrogenDropdownMenuItem onSelect={this.handleClickLogout}>
              Log Out
            </NitrogenDropdownMenuItem>
          </NitrogenDropdown>
        ) : (
          <button className='btn btn-primary btn-block login-btn' onClick={this.handleClickLoginBtn}>
            <Icon icon='sign-in' />
          </button>
        )}
      </div>
    );
  }
}
