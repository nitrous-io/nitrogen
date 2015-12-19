'use strict';

const eventedSocket = require('./evented-socket'),
      emitter = require('../../emitter'),
      iwc = require('../../util/iwc');

class EventsSocket {
  constructor() {
    this._socket = null;
  }

  connect(url, token) {
    let eventUrl = url.replace('http', 'ws');
    if (token) {
      eventUrl = `${eventUrl}?token=${token}`;
    }

    this._socket = new eventedSocket(eventUrl);
    this._socket.on('message', this.handleMessage);
    this._socket.connect();
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
    }
  }

  get connected() {
    if (this._socket) {
      return this._socket.connected;
    }
    return false;
  }

  handleMessage(message) {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (e) {
      return;
    }

    const event = `events:${msg.name.replace(/_/g, '-')}`,
          data = msg.data;

    emitter.emit(event, data);
    iwc.send(event, data);
  }
}

module.exports = new EventsSocket();
