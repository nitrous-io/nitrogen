/** @babel */

/* When unison downloads files modified remotely (in shell or web ide),
 * it does an atomic update of the file by renaming old file to *.unison.tmp
 * and then saving the new file over the new path. Because of this, if the
 * updated file is already open in atom, instead of updating and reloading
 * the file at original path, it loads the tmp file. This monkey-patches
 * File::setPath method to fix that.
 */

import { CompositeDisposable } from 'atom';

class RenameWatcher {
  subscriptions = null;

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      if (!editor.__watchRename) {
        editor.__watchRename = true;
        watch(editor);
      }
    }));
  }

  deactivate() {
    this.subscriptions.dispose();
  }
}

function watch(editor) {
  let subscriptions = new CompositeDisposable();
  let subscribed = false;

  const patchFile = (editor) => {
    if (subscribed) {
      return;
    }

    const buffer = editor.getBuffer(),
          file = buffer ? buffer.file : null;

    if (file) {
      subscribed = true;
      monkeyPatchFile(file);
    } else {
      subscriptions.add(editor.onDidSave(() => {
        patchFile(editor);
      }));
    }
  };

  subscriptions.add(editor.onDidDestroy(() => {
    subscriptions.dispose();
    subscriptions = null;
  }));

  patchFile(editor);
}

function monkeyPatchFile(file) {
  const File = file.constructor;
  if (!File.prototype.__originalSetPath) {
    File.prototype.__originalSetPath = File.prototype.setPath;

    File.prototype.setPath = function(path) {
      this.__previousPath = this.path;
      if (!path.match(/\.unison\.tmp$/)) {
        this.__originalSetPath(path);
      }
    };
  }
}

export default new RenameWatcher();
