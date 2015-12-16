/** @babel */

import React, { PropTypes } from 'react';
import TextField from './text-field';
import Icon from './icon';
import Container from '../records/container';
import settingStore from '../stores/setting-store';
import { OrderedSet } from 'immutable';

export default class NitrogenContainerSettingsTunneling extends React.Component {
  displayName = 'NitrogenContainerSettingsTunneling';

  static propTypes = {
    container: PropTypes.instanceOf(Container).isRequired
  };

  state = {
    tunneledPorts: OrderedSet()
  }

  componentDidMount() {
    settingStore.onChange(this.settingStoreDidChange);
  }

  componentWillUnmount() {
    settingStore.offChange(this.settingStoreDidChange);
  }

  settingStoreDidChange = () => {
    const { container } = this.props;
    this.setState({
      tunneledPorts: settingStore.getSetting(container.slug).tunneledPorts
    });
  };

  render() {
    const { tunneledPorts } = this.state,
          tunneledPortsList = tunneledPorts.join(', ');

    return (
      <div className='nitrogen-section nitrogen-container-settings-tunneling-component'>
        <h2>Port Forwarding</h2>
        <p><Icon icon='question' />Port forwarding allows you to securely access ports on your Nitrous host from localhost. For example, if you forward port <code>3000</code>, you can access your application running on Nitrous on remote port <code>3000</code> by connecting to <code>localhost:3000</code>. All traffic between localhost and Nitrous host is encrypted with SSL.</p>
        <label>Forwarded Ports</label>
        <TextField ref='tunneledPortsField' initialValue={tunneledPortsList} placeholder='Example: 3000, 4000, 5000-5010, 7777:7000 (local:remote)' />
      </div>
    );
  }
}
