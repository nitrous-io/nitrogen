/** @babel */

import React from 'react';
import NitrogenToolbarAccountMenu from './nitrogen-toolbar-account-menu';

export default class NitrogenToolbar extends React.Component {
  displayName = 'NitrogenToolbar';

  render() {
    return (
      <div className='nitrogen-toolbar-component'>
        <div className='top'>
          <div className='logo' />
        </div>
        <div className='bottom'>
          <NitrogenToolbarAccountMenu />
        </div>
      </div>
    );
  }
}
