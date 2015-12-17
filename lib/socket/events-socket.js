/** @babel */

import EventedSocket from './evented-socket';
import dispatcher from '../app-dispatcher';

class EventsSocket {
  _socket = null;

  constructor() {
    this._socket = null;
  }

  connect(url, token) {
    let eventUrl = url.replace('http', 'ws');
    if (token) {
      eventUrl = `${eventUrl}?token=${token}`;
    }

    this._socket = new EventedSocket(eventUrl);
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

    /* eslint-disable no-console */
    console.log(event, data);
    /* eslint-enable no-console */

    dispatcher.dispatch({
      type: event,
      data
    });
  }
}

export default new EventsSocket();
