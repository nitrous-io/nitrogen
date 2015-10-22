/** @babel */

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';

class Nitrogen {
  toolbarEl = null;
  modalPanel = null;
  subscriptions = null;

  activate(state) {
    this.toolbarEl = new NitrogenToolbarElement();
    this.toolbarEl.deserialize(state.toolbarState);

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.toolbarEl,
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'nitrogen:toggle': () => {
          this.toggle();
        }
      })
    );
  }

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.toolbarEl.destroy();
  }

  serialize() {
    return {
      toolbarState: this.toolbarEl.serialize()
    };
  }

  toggle() {
    console.log('Nitrogen was toggled!');

    if (this.modalPanel.isVisible()) {
      this.modalPanel.hide();
    } else {
      this.modalPanel.show();
    }
  }
}

export default new Nitrogen();
