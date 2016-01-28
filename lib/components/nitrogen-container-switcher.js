/** @babel */

import React, { PropTypes } from 'react';
import userStore from '../stores/user-store';
import hostStore from '../stores/host-store';
import NitrogenLoading from './nitrogen-loading';
import NitrogenDropdown from './nitrogen-dropdown';
import NitrogenContainerSwitcherHost from './nitrogen-container-switcher-host';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';
import Container from '../records/container';
import classNames from 'classnames';

import containerStore from '../stores/container-store';

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
    sharedContainers: containerStore.sharedContainers,
    sharedContainersFetched: containerStore.sharedContainersFetched
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
      sharedContainers: containerStore.sharedContainers,
      sharedContainerFetched: containerStore.sharedContainersFetched
    });
  };

  render() {
    const { onSelect, selectedContainer } = this.props,
          { user, hosts, hostsFetched, sharedContainers, sharedContainerFetched } = this.state,
          fetched = user && hostsFetched && sharedContainerFetched,
          showShared = sharedContainers.size > 0 && sharedContainerFetched,
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
                if (i < sortedHosts.size - 1) {
                  r.push(<NitrogenDropdownMenuItem key={`host-${host.id}-sep`} separator />);
                }
                return r;
              })
            ) : (
              <NitrogenDropdownMenuItem disabled>
                No workstations
              </NitrogenDropdownMenuItem>
            )}

            {showShared ? (
              <div className='nitrogen-container-switcher-host'>
                <NitrogenDropdownMenuItem disabled>
                  <strong>
                    Shared Containers
                  </strong>
                </NitrogenDropdownMenuItem>
              </div>
            ) : (
              ''
            )}

            {showShared ? (
              sharedContainers.toList().map((container) => {
                return (
                  <NitrogenDropdownMenuItem key={`container-${container.id}`} onSelect={function() {
                    onSelect(container.slug);
                  }}>
                    {container.displayName}
                  </NitrogenDropdownMenuItem>
                 );
              })
            ) : (
              ''
            )}
          </NitrogenDropdown>
        ) : (
          loading ? <NitrogenLoading /> : ''
        )}
      </div>
    );
  }
}
