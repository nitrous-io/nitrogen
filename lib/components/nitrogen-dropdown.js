/** @babel */

import React, { PropTypes } from 'react';
import classNames from 'classnames';
import $ from 'jquery';

export default class NitrogenDropdown extends React.Component {
  displayName = 'NitrogenDropdown';

  static propTypes = {
    toggleButton: PropTypes.node.isRequired,
    children: PropTypes.node
  };

  state = {
    show: false
  };

  componentDidMount() {
    $(document).on('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    $(document).off('mousedown', this.handleClickOutside);
  }

  handleClick = () => {
    this.setState({show: !this.state.show});
  };

  handleClickOutside = (e) => {
    if ($(e.target).closest('.nitrogen-dropdown-component').length > 0) {
      return;
    }
    this.setState({show: false});
  };

  render() {
    const { toggleButton, children } = this.props,
          { show } = this.state;

    return (
      <div className={classNames('nitrogen-dropdown-component', { show })}>
        <div className='nitrogen-dropdown-toggle' onClick={this.handleClick}>
          {toggleButton}
        </div>
        {children ? (
          <div className='nitrogen-dropdown-menu'>
            {children}
          </div>
        ) : ''}
      </div>
    );
  }
}
