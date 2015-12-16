/** @babel */

import React, { PropTypes } from 'react';
import containerStore from './stores/container-store';
import NitrogenContainerSettingsTunneling from './nitrogen-container-settings-tunneling';

export default class NitrogenContainerSettings extends React.Component {
  displayName = 'NitrogenContainerSettings';

  static propTypes = {
    containerSlug: PropTypes.string
  };

  state = {
    container: (() => {
      const { containerSlug } = this.props;
      return containerSlug ? containerStore.getContainer(containerSlug) : null;
    }())
  };

  componentDidMount() {
    containerStore.onChange(this.containerStoreDidChange);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.containerSlug !== this.props.containerSlug) {
      this.findContainer(nextProps.containerSlug);
    }
  }

  componentWillUnmount() {
    containerStore.offChange(this.containerStoreDidChange);
  }

  containerStoreDidChange = () => {
    this.findContainer(this.props.containerSlug);
  };

  findContainer(slug) {
    if (!slug) {
      return;
    }
    this.setState({
      container: containerStore.getContainer(slug)
    });
  }

  render() {
    const { container } = this.state;

    return (
      <div className='nitrogen-container-settings-component'>
        {container ? (
          <NitrogenContainerSettingsTunneling container={container} />
        ) : ''}
      </div>
    );
  }
}
