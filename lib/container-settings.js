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

  show = (containerSlug, focus) => {
    var atomUrl = `${settingsUri}${containerSlug}`;
    if (focus) {
      atomUrl = `${atomUrl}?focus=${focus}`;
    }
    atom.workspace.open(atomUrl);
  };
}

export default new ContainerSettings();
