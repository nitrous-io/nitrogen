/** @babel */

import NitrogenToolbar from '../components/nitrogen-toolbar';
import React from 'react';
import ReactDOM from 'react-dom';

class NitrogenToolbarElement extends HTMLElement {
  _component = null;

  createdCallback() {
    this._component = ReactDOM.render(<NitrogenToolbar />, this);
  }

  deserialize(state) {} // eslint-disable-line no-unused-vars

  serialize() {
    return {};
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this);
  }

  get component() {
    return this._component;
  }
}

export default document.registerElement('nitrogen-toolbar', {
  prototype: NitrogenToolbarElement.prototype
});
