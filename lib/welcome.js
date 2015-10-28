/** @babel */

import NitrogenWelcomeElement from './elements/nitrogen-welcome-element';
import NitrogenGuideElement from './elements/nitrogen-guide-element';

class Welcome {
  welcomeUri = 'atom://nitrous/welcome/welcome';
  guideUri = 'atom://nitrous/welcome/guide';

  activate(subscriptions) {
    subscriptions.add(atom.workspace.addOpener((filePath) => {
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
  }

  deactivate() {}

  show() {
    atom.workspace.open(this.welcomeUri);
    atom.workspace.open(this.guideUri, { split: 'right' });
  }
}

export default new Welcome();
