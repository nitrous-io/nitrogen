/** @babel */

import React, { PropTypes } from 'react-for-atom';
import classNames from 'classnames';

export default class Icon extends React.Component {
  displayName = 'Icon';

  static propTypes = {
    icon: PropTypes.string.isRequired
  };

  render() {
    return (
      <i className={classNames('icon', `icon-${this.props.icon}`)} />
    );
  }
}
