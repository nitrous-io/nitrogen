/** @babel */

import NitrogenContainerSettings from '../components/nitrogen-container-settings';
import React from 'react';
import ReactDOM from 'react-dom';

const tagName = 'nitrogen-container-settings',
      settingsUriRegex = /^atom:\/\/nitrogen\/container-settings\/([a-zA-Z0-9\-]+)$/;

class NitrogenContainerSettingsElement extends HTMLElement {
  _component = null;
  _uri = null;
  _containerSlug = null;

  createdCallback() {
    this.render();
  }

  deserialize(state) {
    const uri = this._uri = state.uri,
          match = uri.match(settingsUriRegex);

    this._containerSlug = match ? match[1] : null;

    this.render();
  }

  render() {
    const slug = this._containerSlug;
    this._component = ReactDOM.render(<NitrogenContainerSettings containerSlug={slug} />, this);
  }

  serialize() {
    return {
      deserializer: 'NitrogenContainerSettingsElement',
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
    let title = 'Container Settings';
    if (this._containerSlug) {
      title = this._containerSlug + ' - ' + title;
    }
    return title;
  }

  getURI() {
    return this._uri;
  }
}

export default document.registerElement(tagName, {
  prototype: NitrogenContainerSettingsElement.prototype
});

atom.deserializers.add({
  name: 'NitrogenContainerSettingsElement',
  deserialize(state) {
    const el = document.createElement(tagName);
    el.deserialize(state);
    return el;
  }
});
