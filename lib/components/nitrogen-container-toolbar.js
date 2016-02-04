/** @babel */

import React, { PropTypes } from 'react';
import Container from '../records/container';
import UISwitch from './ui-switch';
import NitrogenPreviewMenu from './nitrogen-preview-menu';
import settingStore from '../stores/setting-store';
import hostStore from '../stores/host-store';
import settingConstants from '../constants/setting-constants';
import iwc from '../util/iwc';
import emitter from '../emitter';
import path from 'path';
import fileUtil from '../util/file-util';
import containerActions from '../actions/container-actions';
import hostActions from '../actions/host-actions';
import config from '../config';
import snackbarActions from '../actions/snackbar-actions';

export default class NitrogenContainerToolbar extends React.Component {
  displayName = 'NitrogenContainerToolbar';

  static propTypes = {
    selectedContainer: PropTypes.instanceOf(Container).isRequired
  };

  state = {
    setting: settingStore.getSetting(this.props.selectedContainer.slug),
    host: hostStore.getHostById(this.props.selectedContainer.hostId)
  };

  componentDidMount() {
    settingStore.onChange(this.settingStoreDidChange);
    hostStore.onChange(this.hostStoreDidChange);
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
    hostStore.offChange(this.hostStoreDidChange);
  }

  settingStoreDidChange = () => {
    this.findSetting(this.props.selectedContainer.slug);
  };

  hostStoreDidChange = () => {
    this.setState({
      host: hostStore.getHostById(this.props.selectedContainer.hostId)
    });
  };

  findSetting(slug) {
    this.setState({ setting: settingStore.getSetting(slug) });
  }

  handleToggleFileSync = () => {
    iwc.send('nsync.toggle-file-sync', this.props.selectedContainer.slug);
  };

  handleToggleTunneling = () => {
    const { setting } = this.state,
          toEnable = !setting.tunnelingEnabled;

    iwc.send('nsync.toggle-tunneling', this.props.selectedContainer.slug);
    if (toEnable && setting.tunneledPorts.size === 0) {
      emitter.emit('show-container-settings', this.props.selectedContainer.slug, settingConstants.PORTS_FIELD);
    }
  };

  handleClickOpenProject = () => {
    const container = this.props.selectedContainer,
          { host } = container,
          p = atom.packages.getLoadedPackage('tree-view');

    if (!p || !p.mainActivated) {
      snackbarActions.post('Please enable tree-view package');
      return;
    }

    if (container && host) {
      const p = path.join(config.nitrousFolderPath, host.slug, container.slug);
      try {
        fileUtil.mkdirPSync(p, 0o755);
      } catch (e) {}

      // This is to show tree view if it is hidden.
      // Otherwise it will not show anything.
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:toggle-focus');
      atom.project.addPath(p);
    }
  };

  handleClickShell = () => {
    emitter.emit('show-shell', this.props.selectedContainer.slug);
  };

  handleClickSettings = () => {
    emitter.emit('show-container-settings', this.props.selectedContainer.slug, settingConstants.PORTS_FIELD);
  };

  startContainer = () => {
    containerActions.start(this.props.selectedContainer);
  };

  startHost = () => {
    hostActions.start(this.state.host);
  }

  renderStartButton() {
    const { host } = this.state;
    let clickHandler, buttonLabel;

    if (host && host.isStopped) {
      clickHandler = this.startHost.bind(this);
      buttonLabel = 'Start Workstation';
    } else {
      clickHandler = this.startContainer.bind(this);
      buttonLabel = 'Start Project';
    }

    return (
      <div className='toolbar-segments'>
        <div className='toolbar-segment'>
          <button className='btn btn-default icon icon-playback-play' onClick={clickHandler}>{buttonLabel}</button>
        </div>
      </div>
    );
  }

  renderState() {
    const { selectedContainer } = this.props,
          { host } = this.state;
    let message;

    if (!host.isRunning) {
      message = `Workstation is ${host.state}...`;
    } else {
      message = `Project is ${selectedContainer.state}...`;
    }

    return (
      <div className='toolbar-segments'>
        <div className='toolbar-segment'>
          <button className='btn btn-default' disabled>{message}</button>
        </div>
      </div>
    );
  }

  render() {
    const { selectedContainer } = this.props,
          { setting, host } = this.state,
          showStartButton = selectedContainer.isStopped || (host && host.isStopped);

    return (
      <div className='nitrogen-container-toolbar-component'>
        {setting ? (
          showStartButton ? (
            this.renderStartButton()
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
            this.renderState()
          ))
        ) : ''}
      </div>
    );
  }
}
