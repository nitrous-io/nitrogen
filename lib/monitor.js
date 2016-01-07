/** @babel */

import usage from 'usage';
import snackbarActions from './actions/snackbar-actions';
import iwc from './util/iwc';
import platform from './util/platform';

class Monitor {
  interval = 2000; // 2s
  threshold = 50; // 50%
  _watcher = null;
  pid = null;
  history = [];
  maxHistoryLength = 10;

  activate() {
    this.pid = process.pid;
    this.watch();
  }

  deactivate() {
    clearInterval(this._watcher);
  }

  watch() {
    if(!platform.isWindows) {
      this._watcher = setInterval(() => {
        usage.lookup(this.pid, this.check.bind(this));
      }, this.interval);  
    }
  }

  check(err, r) {
    const history = this.history;

    if (history.length >= this.maxHistoryLength) {
      history.shift()
    }
    history.push(r.cpu)

    let total = 0
    history.forEach( (percent) => {
      total += percent;
    });

    const avg = total / history.length;
    const message = `[PID ${this.pid}] CPU usage: ${avg}%`;

    if (history.length >= this.maxHistoryLength && avg > this.threshold) {
      iwc.send('nsync.debug-log', message);
      snackbarActions.post(message, 'warning');
    }
  }
}

export default new Monitor();
