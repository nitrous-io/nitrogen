/** @babel */

import React, { PropTypes } from 'react';
import classNames from 'classnames';

export default class UISwitch extends React.Component {
  displayName = 'UISwitch';

  static propTypes = {
    on: PropTypes.bool,
    disabled: PropTypes.bool,
    onToggle: PropTypes.func,
    toggleDelay: PropTypes.number // to prevent rapid clicking
  };

  static defaultProps = {
    on: false,
    toggleDelay: 1000
  };

  state = {
    togglingDisabled: false
  };

  handleClick = () => {
    if (this.props.disabled || this.state.togglingDisabled) {
      return;
    }

    const { onToggle, toggleDelay } = this.props,
          val = !this.props.on;

    this.setState({ togglingDisabled: true });
    window.setTimeout(() => {
      this.setState({ togglingDisabled: false });
    }, toggleDelay);

    if (onToggle) {
      onToggle(val);
    }
  };

  render() {
    const { on, disabled } = this.props,
          { togglingDisabled } = this.state;

    return (
      <div className={classNames('ui-switch-component', { on, disabled: disabled || togglingDisabled })} onClick={this.handleClick}>
        <div className='background' />
        <div className='toggler' />
      </div>
    );
  }
}
