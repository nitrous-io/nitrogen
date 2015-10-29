/** @babel */

import NitrogenWelcome from '../components/nitrogen-welcome';
import React from 'react';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-welcome';

class NitrogenWelcomeElement extends HTMLElement {
  _component = null;
  _uri = null;

  createdCallback() {
    this._component = ReactDOM.render(<NitrogenWelcome />, this);
  }

  deserialize(state={}) {
    this._uri = state.uri;
  }

  serialize() {
    return {
      deserializer: 'NitrogenWelcomeElement',
      uri: this.getURI()
    };
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this);
  }

  get component() {
    return this._component;
  }

  getTitle() {
    return "Welcome to Nitrogen!";
  }

  getURI() {
    return this._uri;
  }
}

export default document.registerElement(tagName, {
  prototype: NitrogenWelcomeElement.prototype
});

atom.deserializers.add({
  name: 'NitrogenWelcomeElement',
  deserialize(state) {
    const el = document.createElement(tagName);
    el.deserialize(state);
    return el;
  }
});
