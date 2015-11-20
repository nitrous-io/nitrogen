/** @babel */

import React from 'react';
import ReactDOM from 'react-dom';
import nitrousLogo from '../svgs/nitrous-logo';
import TextField from './text-field';
import tokenActions from '../actions/token-actions';
import tokenStore from '../stores/token-store';

export default class NitrogenLogin extends React.Component {
  displayName = 'NitrogenLogin';

  state = {
    loggingIn: false,
    login: '',
    password: ''
  };

  componentDidMount() {
    tokenStore.onChange(this.tokenStoreDidChange);
  }

  componentWillUnmount() {
    tokenStore.offChange(this.tokenStoreDidChange);
  }

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
      } else if (e.keyCode === 13) {
        this.handleLogin();
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
      } else if (e.keyCode === 13) {
        this.handleLogin();
      }
    }
  };

  handleTextChange = () => {
    const { loginField, passwordField, loginBtn } = this.refs;

    if (!loginField || !passwordField || !loginBtn) {
      return;
    }

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
    const { loginField, passwordField } = this.refs,
          login = loginField.getValue(),
          password = passwordField.getValue();

    if (login && password) {
      this.setState({ loggingIn: true });
      tokenActions.fetch(login, password);
    }
  };

  focusLogin() {
    const { loginField } = this.refs;
    loginField.select();
    loginField.focus();
  }

  tokenStoreDidChange = () => {
    if (tokenStore.lastError) {
      this.setState({
        loggingIn: false
      }, () => {
        const { loginField } = this.refs;
        loginField.select();
        loginField.focus();
      });
    }
  }

  render() {
    const { login, password } = this.state,
          loggingIn = this.state.loggingIn,
          loginBtnDisabled = !login || !password || loggingIn,
          loginLabel = loggingIn ? 'Logging In...' : 'Log In',
          nitrousHost = atom.config.get('nitrogen.nitrousHost');

    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-login-component'>
        <div className='nitrous-logo' dangerouslySetInnerHTML={{__html: nitrousLogo.svg}} />
        <TextField ref='loginField' onChange={this.handleTextChange}
          onKeyDown={this.handleKeyDown} placeholder='Username or Email' />
        <TextField ref='passwordField' secure onChange={this.handleTextChange}
          onKeyDown={this.handleKeyDown} placeholder='Password' />
        <div className='btn-wrap-group'>
          <button ref='loginBtn' className='btn btn-primary btn-block' onClick={this.handleLogin}
            disabled={loginBtnDisabled}>{loginLabel}</button>
        </div>
        <p>No account? <a href={`${nitrousHost}/app/#/signup`}>Sign Up</a>.</p>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
