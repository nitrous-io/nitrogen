/** @babel */

import NitrogenWebviewElement from './elements/nitrogen-webview-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';

const webviewUri = 'atom://nitrogen/webview/';

class Webview {
  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.addOpener((filePath) => {
      if (filePath.startsWith(webviewUri)) {
        const el = new NitrogenWebviewElement();
        el.deserialize({ uri: filePath });
        return el;
      }
    }));

    emitter.on('show-webview', this.show);
  }

  deactivate() {
    emitter.off('show-webview', this.show);
    this.subscriptions.dispose();
  }

  show = (uri) => {
    atom.workspace.open(webviewUri + +new Date() + '/' + uri);
  };
}

export default new Webview();
