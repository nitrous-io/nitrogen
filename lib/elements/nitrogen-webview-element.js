/** @babel */

import NitrogenWebview from '../components/nitrogen-webview';
import { Emitter } from 'atom';
import React from 'react';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-webview',
      webviewUriRegex = /^atom:\/\/nitrogen\/webview\/\d+\/(.+)$/;

class NitrogenWebviewElement extends HTMLElement {
  _component = null;
  _uri = null;
  _title = null;
  _emitter = null;

  createdCallback() {
    this.render();
    this._emitter = new Emitter();
  }

  deserialize(state) {
    this._uri = state.uri;
    this.render();
  }

  render() {
    const uri = this._uri,
          match = uri ? uri.match(webviewUriRegex) : null;

    let url;

    if (match) {
      url = match[1];
    }

    this._component = ReactDOM.render(<NitrogenWebview url={url} onTitleChange={this.titleDidChange.bind(this)} />, this);
  }

  serialize() {
    return {
      deserializer: 'NitrogenWebviewElement',
      uri: this.getURI()
    };
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this);
    this._emitter.dispose();
    this._emitter = null;
  }

  get component() {
    return this._component;
  }

  getTitle() {
    return this._title || 'Webview';
  }

  getURI() {
    return this._uri;
  }

  titleDidChange(title) {
    this._title = title;
    if (this._emitter) {
      this._emitter.emit('did-change-title');
    }
  }

  onDidChangeTitle(callback) {
    if (this._emitter) {
      return this._emitter.on('did-change-title', callback);
    }
  }
}

export default document.registerElement(tagName, {
  prototype: NitrogenWebviewElement.prototype
});

atom.deserializers.add({
  name: 'NitrogenWebviewElement',
  deserialize(state) {
    const el = document.createElement(tagName);
    el.deserialize(state);
    return el;
  }
});

