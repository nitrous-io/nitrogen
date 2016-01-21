'use strict';

const eventedSocket = require('./evented-socket');

module.exports = class PingerSocket {
  constructor(nitrousHost, hostID, token) {
    this._url = `${nitrousHost.replace('http', 'ws')}/api/v0/hosts/${hostID}/activity?token=${encodeURIComponent(token)}`;
    this._socket = null;
    this._lastSent = null;
    this._lastAck = null;
  }

  connect() {
    this._socket = new eventedSocket(this._url);
    this._socket.on('open', this.didOpen.bind(this));
    this._socket.on('message', this.handleMessage.bind(this));
    this._socket.connect();
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
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
    const timestamp = Date.now();
    this._socket.send(`active|${timestamp}`);
    this._lastSent = timestamp;
  }
};
