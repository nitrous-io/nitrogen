/** @babel */

import { CompositeDisposable } from 'atom';

import snackbarActions from './actions/snackbar-actions';
import NitrogenGitHubLoginElement from './elements/nitrogen-github-login-element';
import emitter from './emitter';
import tokenStore from './stores/token-store';

const gitHubLoginUri = "atom://nitrogen/github_login";

class GitHubLogin {
  subscriptions = null;
  gitHubOauthUrl = null;
  el = null;
  item = null;

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.addOpener(() => {
      return this.el;
    }));

    emitter.on('show-github-login', this.show);
    tokenStore.onChange(this.tokenStoreDidChange);
  }

  deactivate() {
    tokenStore.offChange(this.tokenStoreDidChange);
    emitter.off('show-github-login', this.show);
    this.subscriptions.dispose();
    this.hide();
  }

  tokenStoreDidChange = () => {
    if (tokenStore.token) {
      snackbarActions.post('You have successfully logged in with GitHub to Nitrous.');
      this.hide();
    }
  };

  show = (url) => {
    if (this.el) {
      this.hide();
    }

    this.gitHubOauthUrl = url;
    this.el = new NitrogenGitHubLoginElement();
    this.el.renderWithUrl(this.gitHubOauthUrl);

    atom.workspace.open(gitHubLoginUri).then((item) => {
      this.item = item;
    });
  };

  hide = () => {
    if (this.el) {
      this.el.destroy();
      this.el = null;
    }

    if (this.item) {
      const pane = atom.workspace.paneContainer.paneForItem(this.item);
      if (pane) {
        pane.destroyItem(this.item);
        this.item = null;
      }
    }
  }
}

export default new GitHubLogin();
