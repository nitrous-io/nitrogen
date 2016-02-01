/** @babel */

import NitrogenGitHubLogin from '../components/nitrogen-github-login';
import React from 'react';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-github-login';

class NitrogenGitHubLoginElement extends HTMLElement {
  _url = null;
  _component = null;

  renderWithUrl(url) {
    this._url = url;
    this._component = ReactDOM.render(<NitrogenGitHubLogin url={this._url} />, this);
  }

  deserialize(state) {} // eslint-disable-line no-unused-vars

  serialize() {
    return {};
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
