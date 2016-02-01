/** @babel */

import NitrogenGitHubLoginElement from './elements/nitrogen-github-login-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';

const gitHubLoginUri = 'https://github.com/login/oauth/authorize';

class GitHubLogin {
  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.addOpener((url) => {
      if (url.startsWith(gitHubLoginUri)) {
        const el = new NitrogenGitHubLoginElement();
        el.deserialize({ url });
        return el;
      }
    }));

    emitter.on('show-github-login', this.show);
  }

  deactivate() {
    emitter.off('show-github-login', this.show);
    this.subscriptions.dispose();
  }

  show = (uri) => {
    atom.workspace.open(uri);
  };
}

export default new GitHubLogin();
