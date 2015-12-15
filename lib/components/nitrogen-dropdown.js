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

  static childContextTypes = {
    hideMenuFn: PropTypes.func
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

  getChildContext() {
    return {
      hideMenuFn: () => {
        this.setState({show: false});
      }
    };
  }

  handleClick = () => {
    this.setState({show: !this.state.show});
  };

  handleClickOutside = (e) => {
    const $closest = $(e.target).closest('.nitrogen-dropdown-component');
    if ($closest.length > 0 && $closest[0] === this.refs.dropdown) {
      return;
    }
    this.setState({show: false});
  };

  render() {
    const { toggleButton, children } = this.props,
          { show } = this.state;

    return (
      <div ref='dropdown' className={classNames('nitrogen-dropdown-component', { show })}>
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
