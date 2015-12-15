/** @babel */

import React, { PropTypes } from 'react';
import Container from '../records/container';
import UISwitch from './ui-switch';

export default class NitrogenContainerToolbar extends React.Component {
  displayName = 'NitrogenContainerToolbar';

  static propTypes = {
    selectedContainer: PropTypes.instanceOf(Container)
  };

  state = {
    fileSyncEnabled: false,
    tunnelingEnabled: false
  };

  handleToggleFileSync = (enabled) => {
    this.setState({ fileSyncEnabled: enabled });
  };

  handleToggleTunneling = (enabled) => {
    this.setState({ tunnelingEnabled: enabled });
  };

  render() {
    const { selectedContainer } = this.props,
          { fileSyncEnabled, tunnelingEnabled } = this.state;

    return (
      selectedContainer ? (
        <div className='nitrogen-container-toolbar-component'>
          <div className='toolbar-segment btn-group'>
            <button className='btn btn-default icon icon-file-directory'>Open Project</button>
            <button className='btn btn-default icon icon-gear'>Settings</button>
          </div>

          <div className='toolbar-segment'>
            <UISwitch enabled={tunnelingEnabled} onToggle={this.handleToggleTunneling} />
            <span>Port Forwarding</span>
          </div>

          <div className='toolbar-segment'>
            <UISwitch enabled={fileSyncEnabled} onToggle={this.handleToggleFileSync} />
            <span>File Sync</span>
          </div>
        </div>
      ) : <div className='nitrogen-container-toolbar-component hide' />
    );
  }
}
