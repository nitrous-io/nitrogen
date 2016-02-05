/** @babel */

import Store from './store';
import hostStore from './host-store';
import User from '../records/user';

// Fix usage based on system time every minute.
const timeToFixUsage = 60, // in seconds
      tickInterval = 1000; // in milliseconds

class UserStore extends Store {
  _user = null; // <User>
  _usageRemaining = 0;
  _usageSinceStarted = 0;
  _timer = null;
  _startedTime = null;

  handleAction(action) {
    switch (action.type) {
      case 'token.invalidate': {
        // clear store
        this._user = null;
        this._lastError = null;
        this._usageRemaining = 0;
        this._usageSinceStarted = 0;
        break;
      }
      case 'user.fetched': {
        const { data } = action.data;
        this._user = User.deserialize(data.user);
        this._usageRemaining = this._user.usageRemaining;
        this.tickUsageRemaining();
        this._lastError = null;
        break;
      }
      case 'user.fetch-failed': {
        this._user = null;
        this.handleErrorJqxhr(action.data.jqxhr);
        this._usageRemaining = 0;
        this._usageSinceStarted = 0;
        break;
      }
      default: return;
    }
    this.notifyChange();
  }

  get user() {
    return this._user;
  }

  get username() {
    return this._user ? this._user.username : null;
  }

  get usageRemaining() {
    return this._usageRemaining;
  }

  get nextUsageQuotaAt() {
    return this._user ? this._user.nextUsageQuotaAt : null;
  }

  tickUsageRemaining() {
    this.stopTickUsageRemaining();

    this._startedTime = new Date();
    this._usageSinceStarted = 0;
    this._timer = setInterval(this._updateUsageRemaining.bind(this), tickInterval);
  }

  stopTickUsageRemaining() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _updateUsageRemaining() {
    // it stops countdown when a user upgrade from free to paid
    if (hostStore.hasPaidHosts) {
      this.stopTickUsageRemaining();
    }

    if (this._usageRemaining <= 0) {
      clearInterval(this._timer);
      this._timer = null;
      this._usageRemaining = 0;
      this._usageSinceStarted = 0;
    } else {
      // Pause countdown while a host is not running
      // It still checks if any hosts are running, so it will start countdown again.
      // Update `this._startedTime` to current, So it still fix usage correctly after the host is started.
      if (hostStore.stoppedFreeHosts.size !== 0) {
        this._startedTime = new Date();
        return;
      }

      this._usageRemaining = this._usageRemaining - 1;
      this._usageSinceStarted = this._usageSinceStarted + 1;

      if (this._usageSinceStarted % timeToFixUsage === 0) {
        this._fixUsage();
      }
    }

    this.emit('usage-remaining.tick');
  }

  _fixUsage() {
    const currentTime = new Date(),
          actualUsage = Math.round((currentTime - this._startedTime) / 1000);

    // It fixes the usage if actual usage based on system time is not matched to it
    if (Math.abs(actualUsage - this._usageSinceStarted) > 0) {
      this._usageRemaining -= (actualUsage - this._usageSinceStarted);
      this._usageSinceStarted = actualUsage;
    }
  }
}

export default new UserStore();
