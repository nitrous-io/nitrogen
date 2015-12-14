/** @babel */

import React from 'react';
import NitrogenToolbarAccountMenu from './nitrogen-toolbar-account-menu';
import NitrogenContainerSwitcher from './nitrogen-container-switcher';
import nLogo from '../svgs/n-logo';

export default class NitrogenToolbar extends React.Component {
  displayName = 'NitrogenToolbar';

  render() {
    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-toolbar-component'>
        <div className='left'>
          <div className='logo' dangerouslySetInnerHTML={{__html: nLogo.svg}} />
          <NitrogenContainerSwitcher />
        </div>
        <div className='right'>
          <NitrogenToolbarAccountMenu />
        </div>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
