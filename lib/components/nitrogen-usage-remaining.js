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
    usageRemaining: userStore.usageRemaining,
    nextUsageQuotaAt: userStore.nextUsageQuotaAt
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
      usageRemaining: userStore.usageRemaining,
      nextUsageQuotaAt: userStore.nextUsageQuotaAt
    });
  };

  hostStoreDidChange = () => {
    const { host } = this.props;

    this.setState({
      isFreeHost: host.isFree
    });
  };

  freeUsageBadgeText = () => {
    const { usageRemaining, nextUsageQuotaAt } = this.state,
          nextReset = formatter.nextUsageQuota(nextUsageQuotaAt);

    if (usageRemaining > 0) {
      return `${formatter.secondsToTime(usageRemaining)} remaining for this month`;
    }

    var msg = 'You have used up your free hours.';
    if (nextReset) {
      msg += ' Your quota will reset in ' + nextReset;
    }
    return msg;
  };

  render() {
    const { usageRemaining, isFreeHost } = this.state;

    // Don't show usage remaining if the host is paid or
    // remaining time is longer than 5 hours.
    if (!isFreeHost || usageRemaining > 5 * 60 * 60) {
      return null;
    }

    return (
      <div className="toolbar-segment">
        <span className="usage-remaining badge badge-info badge-flexible">
          {this.freeUsageBadgeText()}
        </span>
      </div>
    );
  }
}
