/** @babel */

import React, { PropTypes } from 'react';
import classNames from 'classnames';

export default class UISwitch extends React.Component {
  displayName = 'UISwitch';

  static propTypes = {
    enabled: PropTypes.bool,
    onToggle: PropTypes.func
  };

  static defaultProps = {
    enabled: false
  };

  state = {
    togglingDisabled: false
  };

  handleClick = () => {
    if (this.state.togglingDisabled) {
      return;
    }

    const { onToggle } = this.props,
          val = !this.props.enabled;

    this.setState({ togglingDisabled: true });
    window.setTimeout(() => {
      this.setState({ togglingDisabled: false });
    }, 500);

    if (onToggle) {
      onToggle(val);
    }
  };

  render() {
    const { enabled } = this.props;

    return (
      <div className={classNames('ui-switch-component', { enabled })} onClick={this.handleClick}>
        <div className='background' />
        <div className='toggler' />
      </div>
    );
  }
}
