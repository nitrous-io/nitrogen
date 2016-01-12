/** @babel */

import NitrogenFeedback from '../components/nitrogen-feedback';
import React from 'react';
import ReactDOM from 'react-dom';

class NitrogenFeedbackElement extends HTMLElement {
  _component = null;

  createdCallback() {
    this._component = ReactDOM.render(<NitrogenFeedback />, this);
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

export default document.registerElement('nitrogen-feedback', {
  prototype: NitrogenFeedbackElement.prototype
});
