/** @babel */

import React from 'react';

export default class NitrogenGuide extends React.Component {
  displayName = 'NitrogenGuide';

  handleLoginBtn = () => {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'nitrogen:show-login-dialog');
  };

  render() {
    return (
      <div className='nitrogen-guide-component nitrogen-welcome'>
        <div className='nitrogen-welcome-container'>
          <section className='nitrogen-welcome-panel'>
            <h1 className='nitrogen-welcome-title'>Get started with Nitrogen!</h1>

            <ul className='nitrogen-welcome-buttons'>
              <li>
                <button className='nitrogen-welcome-button primary' onClick={this.handleLoginBtn}>
                  <i className='icon icon-sign-in' />
                  Log in to Nitrous
                </button>
              </li>

              <li>
                <button className='nitrogen-welcome-button'>
                  <i className='icon icon-person' />
                  Create a Nitrous account
                </button>
              </li>

              <li>
                <button className='nitrogen-welcome-button'>
                  <i className='icon icon-mortar-board' />
                  Open Tutorials
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    );
  }
}
