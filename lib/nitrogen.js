/** @babel */

import NitrogenView from './nitrogen-view';
import { CompositeDisposable } from 'atom';

class Nitrogen {
  nitrogenView = null;
  modalPanel = null;
  subscriptions = null;

  activate(state) {
    this.nitrogenView = new NitrogenView(state.nitrogenViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.nitrogenView.getElement(),
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
    this.nitrogenView.destroy();
  }

  serialize() {
    return {
      nitrogenViewState: this.nitrogenView.serialize()
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
