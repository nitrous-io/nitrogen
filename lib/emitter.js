/** @babel */

import { EventEmitter } from 'events';

class NitrogenEmitter extends EventEmitter {
  off(...args) {
    this.removeListener(...args);
  }
}

export default new NitrogenEmitter();
