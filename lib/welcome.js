/** @babel */

import NitrogenWelcomeElement from './elements/nitrogen-welcome-element';
import NitrogenGuideElement from './elements/nitrogen-guide-element';
import { CompositeDisposable } from 'atom';

class Welcome {
  welcomeUri = 'atom://nitrogen/welcome/welcome';
  guideUri = 'atom://nitrogen/welcome/guide';

  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.addOpener((filePath) => {
      if (filePath === this.welcomeUri) {
        const el = new NitrogenWelcomeElement();
        el.deserialize({ uri: filePath });
        return el;
      } else if (filePath === this.guideUri) {
        const el = new NitrogenGuideElement();
        el.deserialize({ uri: filePath });
        return el;
      }
    }));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'nitrogen:show-welcome': () => {
          this.show();
        }
      })
    );

    if (atom.config.get('nitrogen.showWelcomeOnStartup')) {
      this.show();
      atom.config.set('nitrogen.showWelcomeOnStartup', false);
    }
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  show() {
    atom.workspace.open(this.welcomeUri);
    atom.workspace.open(this.guideUri, { split: 'right' });
  }
}

export default new Welcome();
