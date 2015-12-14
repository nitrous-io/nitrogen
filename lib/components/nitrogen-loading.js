/** @babel */

import React from 'react';
import loading from '../svgs/loading';

export default class NitrogenLoading extends React.Component {
  displayName = 'NitrogenLoading';

  render() {
    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-loading-component' dangerouslySetInnerHTML={{__html: loading.svg}} />
    );
    /*eslint-enable react/no-danger*/
  }
}
