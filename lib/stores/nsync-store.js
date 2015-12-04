/** @babel */

import Store from './store';
import snackbarActions from '../actions/snackbar-actions';
import stringUtil from '../util/string-util';
import iwc from '../util/iwc';

class NsyncStore extends Store {
  _ready = false;
  _port = null;

  constructor() {
    super();
    this._ready = stringUtil.parseBool(iwc.getEnv('NSYNC_RUNNER_READY'));
    this._port = stringUtil.atoi(iwc.getEnv('NSYNC_PORT'));

    iwc.on('nsync-runner.ready', () => {
      this._ready = true;
      this.notifyChange();
    });

    iwc.on('nsync-runner.server-running', (port) => {
      this._port = port;
      snackbarActions.post(`Sync server is running at port ${port}`);
      this.notifyChange();
    });
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._ready = false;
        this._port = null;
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get ready() {
    return this._ready;
  }

  get port() {
    return this._port;
  }

  get running() {
    return !!this._port;
  }
}

export default new NsyncStore();
