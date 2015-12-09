/** @babel */

import NitrogenGuide from '../components/nitrogen-guide';
import React from 'react-for-atom';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-guide';

class NitrogenGuideElement extends HTMLElement {
  _component = null;
  _uri = null;

  createdCallback() {
    this._component = ReactDOM.render(<NitrogenGuide />, this);
  }

  deserialize(state={}) {
    this._uri = state.uri;
  }

  serialize() {
    return {
      deserializer: 'NitrogenGuideElement',
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
    return "Nitrogen Welcome Guide";
  }

  getURI() {
    return this._uri;
  }
}

export default document.registerElement(tagName, {
  prototype: NitrogenGuideElement.prototype
});

atom.deserializers.add({
  name: 'NitrogenGuideElement',
  deserialize(state) {
    const el = document.createElement(tagName);
    el.deserialize(state);
    return el;
  }
});
