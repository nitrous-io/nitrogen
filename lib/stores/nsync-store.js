/** @babel */

import Store from './store';
import snackbarActions from '../actions/snackbar-actions';
import stringUtil from '../util/string-util';
import iwc from '../util/iwc';

class NsyncStore extends Store {
  _runnerReady = false;
  _initialized = false;
  _port = null;

  constructor() {
    super();
    this._runnerReady = stringUtil.parseBool(iwc.getEnv('NSYNC_RUNNER_READY'));
    this._port = stringUtil.atoi(iwc.getEnv('NSYNC_PORT'));

    iwc.on('nsync-runner.ready', () => {
      this._runnerReady = true;
      this.notifyChange();
    });

    iwc.on('nsync-runner.server-running', (port) => {
      this._initialized = true;
      this._port = port;
      this.notifyChange();
    });

    iwc.on('nsync-runner.server-killed', () => {
      // clear store
      this._port = null;
      snackbarActions.post('Sync server killed!', 'error');
      this.notifyChange();
    });
  }

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        iwc.send('nsync-runner.kill-server');
        return; // no notifyChange
      }
      default: return;
    }
    this.notifyChange();
  }

  get initialized() {
    return this._initialized;
  }

  get runnerReady() {
    return this._runnerReady;
  }

  get port() {
    return this._port;
  }

  get running() {
    return !!this._port;
  }
}

export default new NsyncStore();
