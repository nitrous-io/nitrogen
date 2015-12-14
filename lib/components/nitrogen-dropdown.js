/** @babel */

import React, { PropTypes } from 'react';
import classNames from 'classnames';

export default class NitrogenDropdown extends React.Component {
  displayName = 'NitrogenDropdown';

  static propTypes = {
    toggleButton: PropTypes.node.isRequired,
    children: PropTypes.node
  };

  state = {
    show: false
  };

  handleClick = () => {
    this.setState({show: !this.state.show});
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
