/** @babel */

import React, { PropTypes } from 'react';
import userStore from '../stores/user-store';
import hostStore from '../stores/host-store';
import containerStore from '../stores/container-store';
import NitrogenLoading from './nitrogen-loading';
import NitrogenDropdown from './nitrogen-dropdown';
import NitrogenContainerSwitcherHost from './nitrogen-container-switcher-host';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';

export default class NitrogenContainerSwitcher extends React.Component {
  displayName = 'NitrogenContainerSwitcher';

  static propTypes = {
    selectedContainerSlug: PropTypes.string,
    onSelect: PropTypes.func
  };

  state = {
    user: userStore.user,
    hosts: hostStore.liveHosts,
    hostsFetched: hostStore.fetched,
    selectedContainer: containerStore.containers.get(this.props.selectedContainerSlug)
  };

  componentDidMount() {
    userStore.onChange(this.userStoreDidChange);
    hostStore.onChange(this.hostStoreDidChange);
    containerStore.onChange(this.containerStoreDidChange);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedContainerSlug !== this.props.selectedContainerSlug) {
      this.setState({
        selectedContainer: containerStore.containers.get(nextProps.selectedContainerSlug)
      });
    }
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
      selectedContainer: containerStore.containers.get(this.props.selectedContainerSlug)
    });
  };

  render() {
    const { onSelect, selectedContainerSlug } = this.props,
          { user, hosts, hostsFetched, selectedContainer } = this.state,
          fetched = user && hostsFetched;

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
      <div className='nitrogen-container-switcher-component'>
        {fetched ? (
          <NitrogenDropdown toggleButton={
            selectedContainerSlug ? (
              selectedContainer ? selectedContainer.displayName : selectedContainerSlug
            ) : 'Projects'
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
          </NitrogenDropdown>
        ) : (
          user ? <NitrogenLoading /> : ''
        )}
      </div>
    );
  }
}
