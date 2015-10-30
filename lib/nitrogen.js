/** @babel */

import 'babel/polyfill';

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';
import welcome from './welcome';
import login from './login';
import tokenStore from './stores/token-store';
import userActions from './actions/user-actions';

class Nitrogen {
  subscriptions = null;

  toolbarEl = null;
  toolbarPanel = null;

  config = {
    showWelcomeOnStartup: {
      type: 'boolean',
      default: true,
      description: 'Show the welcome screen the next time a new window is created. This config setting is automatically set to `false` after a new window is created and welcome screen is shown.'
    },
    nitrousHost: {
      type: 'string',
      default: 'https://www.nitrous.io',
      description: 'Hostname for Nitrous'
    }
  };

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.toolbarEl = new NitrogenToolbarElement();
    this.toolbarEl.deserialize(state.toolbarState);

    this.toolbarPanel = atom.workspace.addLeftPanel({
      item: this.toolbarEl,
      visible: true
    });

    welcome.activate();
    login.activate();

    if (tokenStore.token) {
      userActions.fetch();
    }
  }

  deactivate() {
    this.toolbarPanel.destroy();
    this.toolbarEl.destroy();
    welcome.deactivate();
    login.deactivate();

    this.subscriptions.dispose();
  }

  serialize() {
    return {
      toolbarState: this.toolbarEl.serialize()
    };
  }
}

atom.config.set('welcome.showOnStartup', false);

export default new Nitrogen();
