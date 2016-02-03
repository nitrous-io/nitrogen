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
    userStore.onChange(this.userStoreDidChange);
    hostStore.onChange(this.hostStoreDidChange);
  }

  componentWillUnmount() {
    userStore.offChange(this.userStoreDidChange);
    hostStore.offChange(this.hostStoreDidChange);
  }

  userStoreDidChange = () => {
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

    return (
      <div className="toolbar-segment">
        <span className="usage-remaining badge badge-info badge-flexible">
          {formattedUsageRemaining} remaining for this month
        </span>
      </div>
    );
  }
}
