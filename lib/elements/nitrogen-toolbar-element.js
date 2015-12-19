/** @babel */

import NitrogenToolbar from '../components/nitrogen-toolbar';
import React from 'react';
import ReactDOM from 'react-dom';
import containerStore from '../stores/container-store';

class NitrogenToolbarElement extends HTMLElement {
  _component = null;
  _previouslySelectedContainerSlug = null;

  createdCallback() {
    // HTMLElement is not a typical class, so I can't have ES7 property initializers
    this.containerStoreDidChange = this.containerStoreDidChange.bind(this);

    containerStore.onChange(this.containerStoreDidChange);
    this._component = ReactDOM.render(<NitrogenToolbar />, this);
  }

  deserialize(state) {
    if (!state) {
      return;
    }
    this._previouslySelectedContainerSlug = state.selectedContainerSlug;
  }

  serialize() {
    return {
      selectedContainerSlug: (
        this._component && this._component.state && this._component.state.selectedContainer ?
          this._component.state.selectedContainer.slug
        : null
      )
    };
  }

  destroy() {
    containerStore.offChange(this.containerStoreDidChange);
    ReactDOM.unmountComponentAtNode(this);
  }

  get component() {
    return this._component;
  }

  containerStoreDidChange() {
    if (this._previouslySelectedContainerSlug) {
      const container = containerStore.getContainer(this._previouslySelectedContainerSlug);
      if (container) {
        this._component.setState({ selectedContainer: container });
      }
      this._previouslySelectedContainerSlug = null;
    }
    // unsubscribe, we don't need to wait for container store change anymore
    containerStore.offChange(this.containerStoreDidChange);
  }
}

export default document.registerElement('nitrogen-toolbar', {
  prototype: NitrogenToolbarElement.prototype
});
