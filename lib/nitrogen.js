/** @babel */

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';
import welcome from './welcome';

class Nitrogen {
  subscriptions = null;

  toolbarEl = null;
  toolbarPanel = null;

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

export default new Nitrogen();
