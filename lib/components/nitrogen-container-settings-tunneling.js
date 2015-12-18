/** @babel */

import React, { PropTypes } from 'react';
import TextField from './text-field';
import Icon from './icon';
import Container from '../records/container';
import settingStore from '../stores/setting-store';
import { OrderedSet } from 'immutable';
import iwc from '../util/iwc';

export default class NitrogenContainerSettingsTunneling extends React.Component {
  displayName = 'NitrogenContainerSettingsTunneling';

  static propTypes = {
    container: PropTypes.instanceOf(Container).isRequired
  };

  state = {
    tunneledPorts: settingStore.getSetting(this.props.container.slug).tunneledPorts
  };

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

  fixPortMappings(mappings) {
    return OrderedSet(mappings.map(function(v) {
      v = v.replace(/\s/g, '');

      const fixPort = function(port) {
        const i = parseInt(port, 10);
        if (i > 65535) {
          return 65535;
        }
        return i;
      };

      let m;
      if ((m = v.match(/^(\d+)$/))) {
        const p = fixPort(m[1]);
        return p.toString();
      } else if ((m = v.match(/^(\d+)\-(\d+)$/))) {
        const p1 = fixPort(m[1]), p2 = fixPort(m[2]);
        if (p1 > p2 || p1 === p2) {
          return p1.toString();
        }
        return `${p1}-${p2}`;
      } else if ((m = v.match(/^(\d+):(\d+)$/))) {
        const p1 = fixPort(m[1]), p2 = fixPort(m[2]);
        if (p1 === p2) {
          return p1.toString();
        }
        return `${p1}:${p2}`;
      }
      return null;
    }).filter(function(t) {
      return t != null;
    }));
  }

  handleBlurPortsField = () => {
    const { tunneledPortsField } = this.refs,
          { container } = this.props;

    if (!tunneledPortsField) {
      return;
    }

    const p = this.fixPortMappings(tunneledPortsField.getValue().split(',')).toArray();
    iwc.send('nsync.update-tunneled-ports', container.slug, p);
  }

  render() {
    const { tunneledPorts } = this.state,
          tunneledPortsList = tunneledPorts.join(', ');

    return (
      <div className='nitrogen-section nitrogen-container-settings-tunneling-component'>
        <h2>Port Forwarding</h2>
        <p><Icon icon='question' />Port forwarding allows you to securely access ports on your Nitrous host from localhost. For example, if you forward port <code>3000</code>, you can access your application running on Nitrous on remote port <code>3000</code> by connecting to <code>localhost:3000</code>. All traffic between localhost and Nitrous host is encrypted with SSL.</p>
        <label>Forwarded Ports</label>
        <TextField ref='tunneledPortsField' onBlur={this.handleBlurPortsField} value={tunneledPortsList} placeholder='Example: 3000, 4000, 5000-5010, 7777:7000 (local:remote)' />
      </div>
    );
  }
}
