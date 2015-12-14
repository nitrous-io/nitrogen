/** @babel */

import React from 'react';
import userStore from '../stores/user-store';
import hostStore from '../stores/host-store';
import NitrogenLoading from './nitrogen-loading';
import NitrogenDropdown from './nitrogen-dropdown';
import NitrogenContainerSwitcherHost from './nitrogen-container-switcher-host';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';

export default class NitrogenContainerSwitcher extends React.Component {
  displayName = 'NitrogenContainerSwitcher';

  state = {
    user: userStore.user,
    hosts: hostStore.liveHosts,
    hostsFetched: hostStore.fetched
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
    this.setState({ user: userStore.user });
  };

  hostStoreDidChange = () => {
    this.setState({
      hosts: hostStore.liveHosts,
      hostsFetched: hostStore.fetched
    });
  };

  render() {
    const { user, hosts, hostsFetched } = this.state,
          fetched = user && hostsFetched;

    const sortedHosts = hosts.toList().sort((a, b) => {
      if (!a.isOrgHost && b.isOrgHost) {
        return -1;
      } else if (a.isOrgHost && !b.isOrgHost) {
        return 1;
      } else if (a.createdAt < b.createdAt) {
        return -1;
      } else if (a.createdAt > b.createdAt) {
        return 1;
      }
      return 0;
    });

    return (
      <div className='nitrogen-container-switcher-component'>
        {fetched ? (
          <NitrogenDropdown toggleButton='Projects'>
            {sortedHosts.size > 0 ? (
              sortedHosts.map((host) => {
                return <NitrogenContainerSwitcherHost key={`host-${host.id}`} host={host} />;
              })
            ) : (
              <NitrogenDropdownMenuItem disabled>
                No workstations
              </NitrogenDropdownMenuItem>
            )}
          </NitrogenDropdown>
        ) : (
          <NitrogenLoading />
        )}
      </div>
    );
  }
}

