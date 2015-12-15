/** @babel */

import React from 'react';
import containerStore from '../stores/container-store';
import NitrogenAccountMenu from './nitrogen-account-menu';
import NitrogenContainerSwitcher from './nitrogen-container-switcher';
import NitrogenContainerToolbar from './nitrogen-container-toolbar';
import nLogo from '../svgs/n-logo';

export default class NitrogenToolbar extends React.Component {
  displayName = 'NitrogenToolbar';

  state = {
    selectedContainer: null
  };

  componentDidMount() {
    containerStore.onChange(this.containerStoreDidChange);
  }

  componentWillUnmount() {
    containerStore.offChange(this.containerStoreDidChange);
  }

  containerStoreDidChange = () => {
    if (this.state.selectedContainer) {
      this.findContainer(this.state.selectedContainer.slug);
    }
  };

  handleSelect = (slug) => {
    this.findContainer(slug);
  };

  findContainer = (slug) => {
    this.setState({
      selectedContainer: containerStore.containers.get(slug)
    });
  };

  render() {
    const { selectedContainer } = this.state;

    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-toolbar-component'>
        <div className='left'>
          <div className='logo' dangerouslySetInnerHTML={{__html: nLogo.svg}} />
          <NitrogenContainerSwitcher selectedContainer={selectedContainer} onSelect={this.handleSelect} />
          <NitrogenContainerToolbar selectedContainer={selectedContainer} />
        </div>
        <div className='right'>
          <NitrogenAccountMenu />
        </div>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
