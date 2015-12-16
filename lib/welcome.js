/** @babel */

import NitrogenWelcomeElement from './elements/nitrogen-welcome-element';
import NitrogenGuideElement from './elements/nitrogen-guide-element';
import { CompositeDisposable } from 'atom';

const welcomeUri = 'atom://nitrogen/welcome/welcome',
      guideUri = 'atom://nitrogen/welcome/guide';

class Welcome {

  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.addOpener((filePath) => {
      if (filePath === welcomeUri) {
        const el = new NitrogenWelcomeElement();
        el.deserialize({ uri: filePath });
        return el;
      } else if (filePath === guideUri) {
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
    atom.workspace.open(welcomeUri);
    atom.workspace.open(guideUri, { split: 'right' });
  }
}

export default new Welcome();
