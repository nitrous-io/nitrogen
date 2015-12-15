/** @babel */

import React from 'react';
import NitrogenAccountMenu from './nitrogen-account-menu';
import NitrogenContainerSwitcher from './nitrogen-container-switcher';
import nLogo from '../svgs/n-logo';

export default class NitrogenToolbar extends React.Component {
  displayName = 'NitrogenToolbar';

  state = {
    selectedContainerSlug: null
  };

  handleSelect = (slug) => {
    this.setState({ selectedContainerSlug: slug });
  };

  render() {
    const { selectedContainerSlug } = this.state;

    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-toolbar-component'>
        <div className='left'>
          <div className='logo' dangerouslySetInnerHTML={{__html: nLogo.svg}} />
          <NitrogenContainerSwitcher selectedContainerSlug={selectedContainerSlug} onSelect={this.handleSelect} />
        </div>
        <div className='right'>
          <NitrogenAccountMenu />
        </div>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
