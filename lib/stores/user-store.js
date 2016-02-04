/** @babel */

import Store from './store';
import User from '../records/user';

// Fix usage based on system time every minute.
const timeToFixUsage = 60;

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
        // this._usageRemaining = this._user.usageRemaining;
        this._usageRemaining = 30;
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

  tickUsageRemaining() {
    this._startedTime = new Date();
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }

    this._usageSinceStarted = 0;
    this._timer = setInterval(this._updateUsageRemaining.bind(this), 1000);
  }

  _updateUsageRemaining() {
    if (this._usageRemaining <= 0) {
      clearInterval(this._timer);
      this._timer = null;
      this._usageRemaining = 0;
      this._usageSinceStarted = 0;
    } else {
      this._usageRemaining = this._usageRemaining - 1;
      this._usageSinceStarted = this._usageSinceStarted + 1;

      if (this._usageSinceStarted % timeToFixUsage === 0) {
        const currentTime = new Date(),
              actualUsage = Math.round((currentTime - this._startedTime) / 1000);

        // It fixes the usage if actual usage based on system is not matched to it
        if (Math.abs(actualUsage - this._usageSinceStarted) > 0) {
          this._usageRemaining -= (actualUsage - this._usageSinceStarted);
          this._usageSinceStarted = actualUsage;
        }
      }
    }

    this.emit('usage-remaining.tick');
  }
}

export default new UserStore();
