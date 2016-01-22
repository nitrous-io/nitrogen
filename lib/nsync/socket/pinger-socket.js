'use strict';

const eventedSocket = require('./evented-socket');

module.exports = class PingerSocket {
  constructor(nitrousHost, hostID, token) {
    this._url = `${nitrousHost.replace('http', 'ws')}/api/v0/hosts/${hostID}/activity?token=${encodeURIComponent(token)}`;
    this._hostID = hostID;
    this._socket = null;
    this._lastSent = null;
    this._lastAck = null;
    this._lastFailed = null;
    this._pingTimeout = null;
    this._pingWait = 5000; // 5s
    this._willRunAt = 0;
  }

  connect() {
    this._socket = new eventedSocket(this._url);
    this._socket.on('open', this.didOpen.bind(this));
    this._socket.on('error', this.didFail.bind(this));
    this._socket.on('message', this.handleMessage.bind(this));
    this._socket.connect();
  }

  get connected() {
    if (this._socket) {
      return this._socket.connected;
    }
    return false;
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  didFail() {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
  }

  handleMessage(message) {
    const found = message.match(/^ok\|(\d+)/);
    if (found) {
      this._lastAck = parseInt(found[1], 10);
    }
  }

  didOpen() {
    this.ping();
  }

  ping() {
    this._debouncePing();
  }

  _debouncePing() {
    // If timeout is set, don't schedule again
    if (this._willRunAt - Date.now() > 0) {
      return;
    }

    this._willRunAt = Date.now() + this._pingWait;
    this._pingTimeout = setTimeout(this._ping.bind(this), this._pingWait);
  }

  _ping() {
    if (!this.connected) {
      if (this._socket) {
        this._socket.retry();
      } else {
        this.connect();
      }
      return;
    }

    const timestamp = Date.now();
    this._socket.send(`active|${timestamp}`);
    this._lastSent = timestamp;
  }
};
