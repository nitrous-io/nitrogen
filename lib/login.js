/** @babel */

import NitrogenLoginElement from './elements/nitrogen-login-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';
import $ from 'jquery';
import snackbarActions from './actions/snackbar-actions';
import userActions from './actions/user-actions';
import tokenStore from './stores/token-store';

class Login {
  subscriptions = null;
  modalPanel = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.loginEl = new NitrogenLoginElement();

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'nitrogen:show-login-dialog': () => {
          this.show();
        }
      })
    );

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.loginEl,
      visible: false
    });

    this.subscriptions.add(
      this.modalPanel.onDidChangeVisible(this.handleModalPanelDidChangeVisible)
    );

    emitter.on('hide-login-dialog', this.hide);

    tokenStore.onChange(this.tokenStoreDidChange);
  }

  deactivate() {
    tokenStore.offChange(this.tokenStoreDidChange);
    emitter.off('hide-login-dialog', this.hide);
    this.loginEl.destroy();
    this.subscriptions.dispose();
  }

  handleModalPanelDidChangeVisible = (visible) => {
    if (visible) {
      $('body').on('click.nitrogen-login', (e) => {
        if ($(e.target).closest('nitrogen-login').length === 0) {
          this.hide();
          return;
        }
      }).on('keydown.nitrogen-login', (e) => {
        if (e.keyCode === 27) {
          this.hide();
        }
      });
      this.loginEl.component.focusLogin();
    } else {
      $('body').off('click.nitrogen-login').off('keydown.nitrogen-login');
    }
  };

  tokenStoreDidChange = () => {
    if (tokenStore.token) {
      userActions.fetch();
      snackbarActions.post('Logged in!');
      this.hide();
    }
  };

  show = () => {
    this.modalPanel.show();
  }

  hide = () => {
    this.modalPanel.hide();
  };
}

export default new Login();
