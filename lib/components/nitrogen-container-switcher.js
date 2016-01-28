/** @babel */

import React, { PropTypes } from 'react';
import userStore from '../stores/user-store';
import hostStore from '../stores/host-store';
import containerStore from '../stores/container-store';
import NitrogenLoading from './nitrogen-loading';
import NitrogenDropdown from './nitrogen-dropdown';
import NitrogenContainerSwitcherHost from './nitrogen-container-switcher-host';
import NitrogenContainerSwitcherShared from './nitrogen-container-switcher-shared';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';
import Container from '../records/container';
import classNames from 'classnames';

export default class NitrogenContainerSwitcher extends React.Component {
  displayName = 'NitrogenContainerSwitcher';

  static propTypes = {
    selectedContainer: PropTypes.instanceOf(Container),
    onSelect: PropTypes.func
  };

  state = {
    user: userStore.user,
    hosts: hostStore.liveHosts,
    hostsFetched: hostStore.fetched,
    sharedContainersFetched: containerStore.sharedContainersFetched,
    sharedContainersExist: containerStore.sharedContainers.size > 0
  };

  componentDidMount() {
    userStore.onChange(this.userStoreDidChange);
    hostStore.onChange(this.hostStoreDidChange);
    containerStore.onChange(this.containerStoreDidChange);
  }

  componentWillUnmount() {
    userStore.offChange(this.userStoreDidChange);
    hostStore.offChange(this.hostStoreDidChange);
    containerStore.offChange(this.containerStoreDidChange);
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

  containerStoreDidChange = () => {
    this.setState({
      sharedContainersFetched: containerStore.sharedContainersFetched,
      sharedContainersExist: containerStore.sharedContainers.size > 0
    });
  };

  render() {
    const { onSelect, selectedContainer } = this.props,
          { user, hosts, hostsFetched, sharedContainersFetched, sharedContainersExist } = this.state,
          fetched = user && hostsFetched && sharedContainersFetched,
          loading = user && !fetched;

    // sort hosts to place personal hosts before org hosts and to place older hosts before newer hosts
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
      <div className={classNames('nitrogen-container-switcher-component', { loading })}>
        {fetched ? (
          <NitrogenDropdown toggleButton={
            selectedContainer ? selectedContainer.displayName : 'Projects'
          }>
            {sortedHosts.size > 0 ? (
              sortedHosts.map((host, i) => {
                // not very elegant, but works
                const r = [<NitrogenContainerSwitcherHost key={`host-${host.id}`} host={host} onSelect={onSelect} />];
                if (i < sortedHosts.size - 1 || sharedContainersExist) {
                  r.push(<NitrogenDropdownMenuItem key={`host-${host.id}-sep`} separator />);
                }
                return r;
              })
            ) : (
              !sharedContainersExist ? (
                <NitrogenDropdownMenuItem disabled>
                  No workstations
                </NitrogenDropdownMenuItem>
              ) : (
                ''
              )
            )}

            <NitrogenContainerSwitcherShared onSelect={onSelect} />
          </NitrogenDropdown>
        ) : (
          loading ? <NitrogenLoading /> : ''
        )}
      </div>
    );
  }
}
