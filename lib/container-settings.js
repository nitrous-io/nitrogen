/** @babel */

import NitrogenContainerSettingsElement from './elements/nitrogen-container-settings-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';

const settingsUri = 'atom://nitrogen/container-settings/';

class ContainerSettings {
  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.addOpener((filePath) => {
      if (filePath.startsWith(settingsUri)) {
        const el = new NitrogenContainerSettingsElement();
        el.deserialize({ uri: filePath });
        return el;
      }
    }));

    emitter.on('show-container-settings', this.show);
  }

  deactivate() {
    emitter.off('show-container-settings', this.show);
    this.subscriptions.dispose();
  }

  show = (containerSlug) => {
    atom.workspace.open(settingsUri + containerSlug);
  };
}

export default new ContainerSettings();
