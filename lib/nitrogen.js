/** @babel */

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';
import welcome from './welcome';

class Nitrogen {
  subscriptions = null;

  toolbarEl = null;
  toolbarPanel = null;

  config = {
    showWelcomeOnStartup: {
      type: 'boolean',
      default: true,
      description: 'Show the welcome screen the next time a new window is created. This config setting is automatically set to `false` after a new window is created and welcome screen is shown.'
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

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'nitrogen:show-welcome': () => {
          welcome.show();
        }
      })
    );

    welcome.activate(this.subscriptions);

    if (atom.config.get('nitrogen.showWelcomeOnStartup')) {
      welcome.show();
      atom.config.set('nitrogen.showWelcomeOnStartup', false);
    }
  }

  deactivate() {
    this.toolbarPanel.destroy();
    this.toolbarEl.destroy();
    welcome.deactivate();

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
