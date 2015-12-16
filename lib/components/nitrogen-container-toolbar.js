/** @babel */

import React, { PropTypes } from 'react';
import Container from '../records/container';
import UISwitch from './ui-switch';
import settingStore from '../stores/setting-store';
import iwc from '../util/iwc';

export default class NitrogenContainerToolbar extends React.Component {
  displayName = 'NitrogenContainerToolbar';

  static propTypes = {
    selectedContainer: PropTypes.instanceOf(Container).isRequired
  };

  state = {
    setting: settingStore.getSetting(this.props.selectedContainer.slug)
  };

  componentDidMount() {
    settingStore.onChange(this.settingStoreDidChange);
    this.findSetting(this.props.selectedContainer.slug);
  }

  componentWillReceiveProps(nextProps) {
    const prevContainer = this.props.selectedContainer,
          newContainer = nextProps.selectedContainer;

    if (prevContainer.slug !== newContainer.slug) {
      this.findSetting(newContainer.slug);
    }
  }

  componentWillUnmount() {
    settingStore.offChange(this.settingStoreDidChange);
  }

  settingStoreDidChange = () => {
    this.findSetting(this.props.selectedContainer.slug);
  };

  findSetting(slug) {
    this.setState({ setting: settingStore.getSetting(slug) });
  }

  handleToggleFileSync = () => {
    iwc.send('nsync.toggle-file-sync', this.props.selectedContainer.slug);
  };

  handleToggleTunneling = () => {
    iwc.send('nsync.toggle-tunneling', this.props.selectedContainer.slug);
  };

  render() {
    const { selectedContainer } = this.props,
          { setting } = this.state;

    return (
      <div className='nitrogen-container-toolbar-component'>
        {setting ? (
          selectedContainer.state === 'running' ? (
            <div className='toolbar-segments'>
              <div className='toolbar-segment btn-group'>
                <button className='btn btn-default icon icon-file-directory'>Open Project</button>
                <button className='btn btn-default icon icon-gear'>Settings</button>
              </div>

              <div className='toolbar-segment'>
                <UISwitch on={setting.tunnelingEnabled} onToggle={this.handleToggleTunneling} />
                <span>Port Forwarding</span>
              </div>

              <div className='toolbar-segment'>
                <UISwitch on={setting.fileSyncEnabled} disabled={setting.fileSyncToggling} onToggle={this.handleToggleFileSync} />
                <span>File Sync</span>
              </div>
            </div>
          ) : (
            <div className='toolbar-segments'>
              <div className='toolbar-segment'>
                <button className='btn btn-default icon icon-playback-play'>Start Project</button>
              </div>
            </div>
          )
        ) : ''}
      </div>
    );
  }
}
