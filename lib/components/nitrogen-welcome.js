/** @babel */

import React from 'react';
import nitrogenLogo from '../svgs/nitrogen-logo';

export default class NitrogenWelcome extends React.Component {
  displayName = 'NitrogenWelcome';

  render() {
    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-nitrogen-welcome-component nitrogen-welcome'>
        <div className='nitrogen-welcome-container'>
          <header className='nitrogen-welcome-header'>
            <div className='nitrogen-welcome-logo' dangerouslySetInnerHTML={{__html: nitrogenLogo.svg}} />
            <h1 className='nitrogen-welcome-title'>Nitrogen: Atom, meet Cloud.</h1>
          </header>

          <section className='nitrogen-welcome-panel'>
            <p>For help, please visit:</p>

            <ul>
              <li><a href='https://community.nitrous.io/'>Nitrous Community</a></li>
              <li><a href='https://community.nitrous.io/docs'>Nitrous Docs</a></li>
            </ul>

            <p className='nitrogen-welcome-note nitrogen-welcome-metrics'>
              <strong>Note:</strong> To help us improve Nitrogen, we anonymously
              track usage metrics, such as launch time, screen size, and current
              version. See settings for details and instructions to disable it.
            </p>
          </section>

          <footer className='nitrogen-welcome-footer'>
            Copyright &copy; 2015 Nitrous, Inc. All Rights Reserved
          </footer>
        </div>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
