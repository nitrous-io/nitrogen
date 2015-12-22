/** @babel */

import NitrogenShellElement from './elements/nitrogen-shell-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';

const shellUri = 'atom://nitrogen/shell/';

let shellId = 0;

class Shell {
  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.addOpener((filePath) => {
      if (filePath.startsWith(shellUri)) {
        const el = new NitrogenShellElement();
        el.deserialize({ uri: filePath });
        return el;
      }
    }));

    emitter.on('show-shell', this.show);
  }

  deactivate() {
    emitter.off('show-shell', this.show);
    this.subscriptions.dispose();
  }

  show = (containerSlug) => {
    const uri = shellUri + containerSlug + '/' + ++shellId;
    atom.workspace.open(uri);
  };
}

export default new Shell();
