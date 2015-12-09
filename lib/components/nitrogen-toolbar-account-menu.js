/** @babel */

import React from 'react';
import tokenActions from '../actions/token-actions';
import tokenStore from '../stores/token-store';
import userStore from '../stores/user-store';
import remote from 'remote';
import Icon from './icon';

const Menu = remote.require('menu');

export default class NitrogenToolbarAccountMenu extends React.Component {
  displayName = 'NitrogenToolbarAccountMenu';

  tooltip = null;
  menu = null;

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

    if (this.tooltip) {
      this.tooltip.dispose();
      this.tooltip = null;
    }
    this.menu = null;
  }

  tokenStoreDidChange = () => {
    this.setState({ loggedIn: !!tokenStore.token }, this.updateTooltip);
  };

  userStoreDidChange = () => {
    this.setState({ user: userStore.user }, this.updateTooltip);
  };

  updateTooltip = () => {
    if (this.tooltip) {
      this.tooltip.dispose();
      this.tooltip = null;
    }

    const { loggedIn, user } = this.state;

    if (loggedIn) {
      this.tooltip = atom.tooltips.add(this.refs.accountBtn, { title: user ? `Logged in as ${user.username}` : 'Logged in' });
    } else {
      this.tooltip = atom.tooltips.add(this.refs.loginBtn, { title: 'Log in to Nitrous' });
    }
  };

  handleClickAccountBtn = () => {
    const { user } = this.state;

    this.menu = Menu.buildFromTemplate([
      { label: user ? `Logged in as ${user.username}` : 'Logged In', enabled: false },
      { type: 'separator' },
      { label: 'Log Out', click: this.handleClickLogout }
    ]);

    this.menu.popup(remote.getCurrentWindow());
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
      <div className='nitrogen-toolbar-account-menu-component'>
        {loggedIn ? (
          <div ref='accountBtn' className='account' onClick={this.handleClickAccountBtn}
           style={{ backgroundImage: user ? `url(${user.gravatar(24*2)})` : 'none' }} />
        ) : (
          <button ref='loginBtn' className='btn btn-primary btn-block login-btn' onClick={this.handleClickLoginBtn}>
            <Icon icon='sign-in' />
          </button>
        )}
      </div>
    );
  }
}
