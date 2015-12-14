/** @babel */

import React, { PropTypes } from 'react';
import Host from '../records/host';
import containerStore from '../stores/container-store';
import orgStore from '../stores/org-store';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';

export default class NitrogenContainerSwitcherHost extends React.Component {
  displayName = 'NitrogenContainerSwitcherHost';

  static propTypes = {
    host: PropTypes.instanceOf(Host).isRequired
  };

  state = {
    containers: containerStore.liveContainersByHostId(this.props.host.id),
    containersFetched: containerStore.fetched,
    org: orgStore.orgs.get(this.props.host.orgId)
  };

  componentDidMount() {
    containerStore.onChange(this.containerStoreDidChange);
    orgStore.onChange(this.orgStoreDidChange);
  }

  componentWillUnmount() {
    containerStore.offChange(this.containerStoreDidChange);
    orgStore.offChange(this.orgStoreDidChange);
  }

  containerStoreDidChange = () => {
    this.setState({
      containers: containerStore.liveContainersByHostId(this.props.host.id),
      containersFetched: containerStore.fetched
    });
  };

  orgStoreDidChange = () => {
    this.setState({
      org: orgStore.orgs.get(this.props.host.orgId)
    });
  };

  render() {
    const { containers, containersFetched, org } = this.state,
          { host } = this.props;

    return (
      <div className='nitrogen-container-switcher-host'>
        <NitrogenDropdownMenuItem disabled>
          <strong>
            {host.isOrgHost ? (
              org ? `${org.displayName} (${host.displayName})` : `Org (${host.displayName})`
            ) : (
              `Personal (${host.displayName})`
            )}
          </strong>
        </NitrogenDropdownMenuItem>
        {containersFetched ? (
          containers && containers.size > 0 ? (
            containers.toList().map((container) => {
              return (
                <NitrogenDropdownMenuItem key={`container-${container.id}`}>
                  {container.displayName}
                </NitrogenDropdownMenuItem>
              );
            })
          ) : (
            <NitrogenDropdownMenuItem disabled>
              <em>Empty workstation</em>
            </NitrogenDropdownMenuItem>
          )
        ) : (
          <NitrogenDropdownMenuItem disabled>
            <em>Loading containers...</em>
          </NitrogenDropdownMenuItem>
        )}
      </div>
    );
  }
}
