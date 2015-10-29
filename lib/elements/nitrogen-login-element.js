/** @babel */

import NitrogenLogin from '../components/nitrogen-login';
import React from 'react';
import ReactDOM from 'react-dom';

class NitrogenLoginElement extends HTMLElement {
  _component = null;

  createdCallback() {
    this._component = <NitrogenLogin />;
    ReactDOM.render(this._component, this);
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

export default document.registerElement('nitrogen-login', {
  prototype: NitrogenLoginElement.prototype
});
