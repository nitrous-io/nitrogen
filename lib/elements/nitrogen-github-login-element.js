/** @babel */

import NitrogenGitHubLogin from '../components/nitrogen-github-login';
import React from 'react';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-github-login';

class NitrogenGitHubLoginElement extends HTMLElement {
  _url = null;
  _component = null;

  render() {
    this._component = ReactDOM.render(<NitrogenGitHubLogin url={this._url} />, this);
  }

  deserialize(state) {
    this._url = state.url;
    this.render();
  }

  serialize() {
    return {
      deserializer: 'NitrogenGitHubLoginElement',
      url: this._url
    };
  }

  getTitle() {
    return 'Nitrogen GitHub Login';
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this);
  }

  get component() {
    return this._component;
  }
}

export default document.registerElement(tagName, {
  prototype: NitrogenGitHubLoginElement.prototype
});

atom.deserializers.add({
  name: 'NitrogenGitHubLoginElement',
  deserialize(state) {
    const el = document.createElement(tagName);
    el.deserialize(state);
    return el;
  }
});

