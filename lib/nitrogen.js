/** @babel */

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';

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
  }

  deactivate() {
    this.toolbarPanel.destroy();
    this.toolbarEl.destroy();
    this.subscriptions.dispose();
  }

  serialize() {
    return {
      toolbarState: this.toolbarEl.serialize()
    };
  }
}

export default new Nitrogen();
