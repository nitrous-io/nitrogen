/** @babel */

import React, { PropTypes } from 'react';
import classNames from 'classnames';

export default class NitrogenDropdownMenuItem extends React.Component {
  displayName = 'NitrogenDropdownMenuItem';

  static propTypes = {
    separator: PropTypes.bool,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func,
    children: PropTypes.node
  };

  static contextTypes = {
    hideMenuFn: PropTypes.func
  };

  static defaultProps = {
    separator: false,
    disabled: false
  };

  handleSelect = () => {
    const { onSelect, disabled } = this.props,
          { hideMenuFn } = this.context;
    if (onSelect && !disabled) {
      onSelect();
    }
    if (hideMenuFn) {
      hideMenuFn();
    }
  }

  render() {
    const { separator, disabled, children } = this.props;

    return (
      <div className={classNames('nitrogen-dropdown-menu-item-component', { separator, disabled })}
        onClick={this.handleSelect}>
        {children && !separator ? children : ''}
      </div>
    );
  }
}
