/** @babel */

import React, { PropTypes } from 'react';

import Host from '../records/host';
import userStore from '../stores/user-store';
import hostStore from '../stores/host-store';
import formatter from '../util/formatter';

export default class NitrogenUsageRemaining extends React.Component {
  displayName = 'NitrogenUsageRemaining';

  static propTypes = {
    host: PropTypes.instanceOf(Host).isRequired
  };

  state = {
    isFreeHost: this.props.host.isFree,
    usageRemaining: userStore.usageRemaining
  };

  componentDidMount() {
    userStore.on('usage-remaining.tick', this.usageRemainingDidChange);
    hostStore.onChange(this.hostStoreDidChange);
  }

  componentWillUnmount() {
    userStore.off('usage-remaining.tick', this.usageRemainingDidChange);
    hostStore.offChange(this.hostStoreDidChange);
  }

  usageRemainingDidChange = () => {
    this.setState({
      usageRemaining: userStore.usageRemaining
    });
  };

  hostStoreDidChange = () => {
    const { host } = this.props;

    this.setState({
      isFreeHost: host.isFree
    });
  };

  render() {
    const { usageRemaining, isFreeHost } = this.state,
          formattedUsageRemaining = formatter.secondsToTime(usageRemaining);

    // Don't show usage remaining if the host is paid or
    // remaining time is longer than 5 hours.
    if (!isFreeHost || usageRemaining > 5 * 60 * 60) {
      return null;
    }

    let message;
    if (usageRemaining > 0) {
      message = `${formattedUsageRemaining} remaining for this month`;
    } else {
      message = `You have used up your free hours. Your quota will reset in 30 days`;
    }

    return (
      <div className="toolbar-segment">
        <span className="usage-remaining badge badge-info badge-flexible">
          {message}
        </span>
      </div>
    );
  }
}
