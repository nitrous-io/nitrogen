/** @babel */

import React, { PropTypes } from 'react';
import Container from '../records/container';
import UISwitch from './ui-switch';
import NitrogenPreviewMenu from './nitrogen-preview-menu';
import settingStore from '../stores/setting-store';
import iwc from '../util/iwc';
import emitter from '../emitter';
import path from 'path';
import fileUtil from '../util/file-util';
import containerActions from '../actions/container-actions';
import config from '../config';

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
    const setting = settingStore.getSetting(slug);
    if (setting.syncReady) {
      emitter.emit('enable-file-upload', this.props.selectedContainer.slug);
    } else {
      emitter.emit('disable-file-upload', this.props.selectedContainer.slug);
    }

    this.setState({ setting });
  }

  handleToggleFileSync = () => {
    iwc.send('nsync.toggle-file-sync', this.props.selectedContainer.slug);
  };

  handleToggleTunneling = () => {
    iwc.send('nsync.toggle-tunneling', this.props.selectedContainer.slug);
  };

  handleClickOpenProject = () => {
    const container = this.props.selectedContainer,
          { host } = container;

    if (container && host) {
      const p = path.join(config.nitrousFolderPath, host.slug, container.slug);
      try {
        fileUtil.mkdirPSync(p, 0o755);
      } catch (e) {}
      atom.project.addPath(p);
    }
  };

  handleClickShell = () => {
    emitter.emit('show-shell', this.props.selectedContainer.slug);
  };

  handleClickSettings = () => {
    emitter.emit('show-container-settings', this.props.selectedContainer.slug);
  };

  handleClickStart = () => {
    containerActions.start(this.props.selectedContainer);
  };

  render() {
    const { selectedContainer } = this.props,
          { setting } = this.state;

    return (
      <div className='nitrogen-container-toolbar-component'>
        {setting ? (
          selectedContainer.state === 'stopped' ? (
            <div className='toolbar-segments'>
              <div className='toolbar-segment'>
                <button className='btn btn-default icon icon-playback-play' onClick={this.handleClickStart}>Start Project</button>
              </div>
            </div>
          ) : (selectedContainer.state === 'running' ? (
            <div className='toolbar-segments'>
              <div className='toolbar-segment btn-group'>
                <button className='btn btn-default icon icon-file-directory' onClick={this.handleClickOpenProject} disabled={!selectedContainer.host}>Open Project</button>
                <button className='btn btn-default icon icon-terminal' onClick={this.handleClickShell}>Shell</button>
                <NitrogenPreviewMenu setting={setting} />
                <button className='btn btn-default icon icon-gear' onClick={this.handleClickSettings}>Settings</button>
              </div>

              <div className='toolbar-segment'>
                <UISwitch on={setting.tunnelingEnabled} onToggle={this.handleToggleTunneling} />
                <span>Port Forwarding</span>
              </div>

              <div className='toolbar-segment'>
                <UISwitch on={setting.syncEnabled} disabled={setting.syncToggling} onToggle={this.handleToggleFileSync} inProgress={setting.isSyncing} />
                <span>File Sync</span>
              </div>
            </div>
          ) : (
            <div className='toolbar-segments'>
              <div className='toolbar-segment'>
                <button className='btn btn-default' disabled>{`Project is ${selectedContainer.displayState}...`}</button>
              </div>
            </div>
          ))
        ) : ''}
      </div>
    );
  }
}
