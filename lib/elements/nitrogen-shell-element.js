/** @babel */

import NitrogenShell from '../components/nitrogen-shell';
import { Emitter } from 'atom';
import React from 'react';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-shell',
      shellUriRegex = /^atom:\/\/nitrogen\/shell\/([a-zA-Z0-9\-]+)$/;

class NitrogenShellElement extends HTMLElement {
  _component = null;
  _uri = null;
  _containerSlug = null;
  _title = null;
  _emitter = null;

  createdCallback() {
    this.render();
    this._emitter = new Emitter();
  }

  deserialize(state) {
    const uri = this._uri = state.uri,
          match = uri.match(shellUriRegex);

    this._containerSlug = match ? match[1] : null;

    this.render();
  }

  render() {
    const slug = this._containerSlug;
    this._component = ReactDOM.render(<NitrogenShell containerSlug={slug} onTitleChange={this.titleDidChange.bind(this)} />, this);
  }

  serialize() {
    return {
      deserializer: 'NitrogenShellElement',
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
    let title = this._title || 'Shell';
    if (this._containerSlug) {
      title = this._containerSlug + ' - ' + title;
    }
    return title;
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
  prototype: NitrogenShellElement.prototype
});

atom.deserializers.add({
  name: 'NitrogenShellElement',
  deserialize(state) {
    const el = document.createElement(tagName);
    el.deserialize(state);
    return el;
  }
});
