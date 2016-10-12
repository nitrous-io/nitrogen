/** @babel */

import Store from './store';
import snackbarActions from '../actions/snackbar-actions';
import stringUtil from '../util/string-util';
import iwc from '../util/iwc';

class NsyncStore extends Store {
  _runnerReady = false;
  _port = null;
  _nsyncVersion = null;
  _nsyncSSHVersion = null;

  constructor() {
    super();
    this._runnerReady = stringUtil.parseBool(iwc.getEnv('NSYNC_RUNNER_READY'));
    this._port = stringUtil.atoi(iwc.getEnv('NSYNC_PORT'));

    iwc.on('nsync-runner.ready', () => {
      this._runnerReady = true;
      this.notifyChange();
    });

    iwc.on('nsync-runner.server-running', (e, port) => {
      this._port = port;
      this.notifyChange();
    });

    iwc.on('nsync-runner.server-killed', () => {
      // clear store
      this._port = null;
      this._nsyncVersion = null;
      this._nsyncSSHVersion = null;
      snackbarActions.post('Sync server killed!', 'error');
      this.notifyChange();
    });

    iwc.on('nsync.fetched-version', (e, nsyncVersion, nsyncSSHVersion) => {
      this._nsyncVersion = nsyncVersion;
      this._nsyncSSHVersion = nsyncSSHVersion;
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

  get runnerReady() {
    return this._runnerReady;
  }

  get port() {
    return this._port;
  }

  get running() {
    return !!this._port;
  }

  get nsyncVersion() {
    return this._nsyncVersion;
  }

  get nsyncSSHVersion() {
    return this._nsyncSSHVersion;
  }
}

export default new NsyncStore();
