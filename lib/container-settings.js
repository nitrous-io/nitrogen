/** @babel */

import NitrogenContainerSettingsElement from './elements/nitrogen-container-settings-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';
import iwc from './util/iwc';

const settingsUri = 'atom://nitrogen/container-settings/';

class ContainerSettings {
  subscriptions = null;
  editorSubscriptions = null;
  editor = null;

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.addOpener((filePath) => {
      if (filePath.startsWith(settingsUri)) {
        const el = new NitrogenContainerSettingsElement();
        el.deserialize({ uri: filePath });
        return el;
      }
    }));

    this.subscriptions.add(atom.workspace.observeTextEditors( (editor) => {
      this.editor = editor;
    }));

    emitter.on('show-container-settings', this.show);
    emitter.on('enable-file-upload', this.enableFileUpload);
    emitter.on('disable-file-upload', this.disableFileUpload);
  }

  deactivate() {
    emitter.off('show-container-settings', this.show);
    emitter.off('enable-file-upload', this.enableFileUpload);
    emitter.off('disable-file-upload', this.disableFileUpload);
    this.subscriptions.dispose();
  }

  show = (containerSlug) => {
    atom.workspace.open(settingsUri + containerSlug);
  };

  enableFileUpload = (containerSlug) => {
    if (this.editorSubscriptions) {
      return;
    }

    this.editorSubscriptions = new CompositeDisposable();

    this.editorSubscriptions.add(this.editor.onDidSave( (file) => {
      iwc.send('nsync.sftp-file', containerSlug, file.path);
    }));
  }

  disableFileUpload = () => {
    if (!this.editorSubscriptions) {
      return;
    }
    this.editorSubscriptions.dispose();
    this.editorSubscriptions = null;
  }
}

export default new ContainerSettings();
