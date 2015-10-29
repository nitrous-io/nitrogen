/** @babel */

import React from 'react';
import ReactDOM from 'react-dom';
import nitrousLogo from '../svgs/nitrous-logo';
import TextField from './text-field';

export default class NitrogenLogin extends React.Component {
  displayName = 'NitrogenLogin';

  state = {
    login: '',
    password: ''
  };

  handleKeyDown = (e) => {
    const { loginField, passwordField, loginBtn } = this.refs;

    if (e.target === ReactDOM.findDOMNode(loginField)) {
      if (e.keyCode === 9) {
        process.nextTick(() => {
          if (e.shiftKey) {
            loginBtn.focus();
          } else {
            passwordField.select();
            passwordField.focus();
          }
        });
      }
    } else if (e.target === ReactDOM.findDOMNode(passwordField)) {
      if (e.keyCode === 9) {
        process.nextTick(() => {
          if (e.shiftKey) {
            loginField.select();
            loginField.focus();
          } else {
            loginBtn.focus();
          }
        });
      }
    }
  };

  handleTextChange = () => {
    const { loginField, passwordField, loginBtn } = this.refs;

    this.setState({
      login: loginField.getValue(),
      password: passwordField.getValue()
    }, () => {
      // hack to force button redraw
      const btn = ReactDOM.findDOMNode(loginBtn);
      btn.style.display = 'none';
      btn.offsetHeight;
      btn.style.display = '';
    });
  }

  handleLogin = () => {
    // not implemented yet
  };

  render() {
    const { login, password } = this.state,
          loginBtnDisabled = !login || !password;

    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-login-component'>
        <div className='nitrous-logo' dangerouslySetInnerHTML={{__html: nitrousLogo.svg}} />
        <TextField ref='loginField' onChange={this.handleTextChange} onKeyDown={this.handleKeyDown} placeholder='Username or Email' />
        <TextField ref='passwordField' secure onChange={this.handleTextChange} onKeyDown={this.handleKeyDown} placeholder='Password' />
        <div className='btn-wrap-group'>
          <button ref='loginBtn' className='btn btn-primary btn-block' onClick={this.handleLogin} disabled={loginBtnDisabled}>Log In</button>
        </div>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
