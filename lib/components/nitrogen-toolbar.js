/** @babel */

import React from 'react';
import NitrogenToolbarAccountMenu from './nitrogen-toolbar-account-menu';

export default class NitrogenToolbar extends React.Component {
  displayName = 'NitrogenToolbar';

  render() {
    return (
      <div className='nitrogen-toolbar-component'>
        <div className='left'>
          <div className='logo' />
        </div>
        <div className='right'>
          <NitrogenToolbarAccountMenu />
        </div>
      </div>
    );
  }
}
