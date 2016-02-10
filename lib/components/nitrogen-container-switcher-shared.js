/** @babel */

import React, { PropTypes } from 'react';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';
import containerStore from '../stores/container-store';

export default class NitrogenContainerSwitcherShared extends React.Component {
  displayName = 'NitrogenContainerSwitcherShared';

  static propTypes = {
    onSelect: PropTypes.func
  };

  state = {
    sharedContainers: containerStore.sharedContainers,
    sharedContainersFetched: containerStore.sharedContainersFetched
  };

  componentDidMount() {
    containerStore.onChange(this.containerStoreDidChange);
  }

  componentWillUnmount() {
    containerStore.offChange(this.containerStoreDidChange);
  }

  containerStoreDidChange = () => {
    this.setState({
      sharedContainers: containerStore.sharedContainers,
      sharedContainersFetched: containerStore.sharedContainersFetched
    });
  };

  renderSharedContainerTitle() {
    const { sharedContainers, sharedContainersFetched } = this.state;
    if (sharedContainersFetched && (!sharedContainers || sharedContainers.size <= 0)) {
      return '';
    }

    return (
      <NitrogenDropdownMenuItem disabled>
        <strong>
          Shared Containers
        </strong>
      </NitrogenDropdownMenuItem>
    );
  }

  render() {
    const { onSelect } = this.props,
          { sharedContainers, sharedContainersFetched } = this.state;

    return (
      <div className='nitrogen-container-switcher-shared-component'>
        {this.renderSharedContainerTitle()}
        {sharedContainersFetched ? (
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
          <NitrogenDropdownMenuItem disabled>
            <em>Loading shared containers...</em>
          </NitrogenDropdownMenuItem>
        )}
      </div>
    );
  }
}
