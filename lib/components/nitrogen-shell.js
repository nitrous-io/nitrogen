/** @babel */

import React, { PropTypes } from 'react';
import userStore from '../stores/user-store';
import platform from '../util/platform';
import iwc from '../util/iwc';
import path from 'path';
import pty from 'pty.js';
import { authedAjax } from '../ajax';
import config from '../config';

export default class NitrogenShell extends React.Component {
  displayName = 'NitrogenShell';
  _iframeLoaded = false;
  _termInitialized = false;
  _proc = null;

  static propTypes = {
    containerSlug: PropTypes.string
  };

  state = {
    sshUrl: null,
    username: userStore.username
  };

  componentDidMount() {
    userStore.onChange(this.userStoreDidChange);
    this.refs.iframe.addEventListener('load', this.iframeDidLoad, false);
    this.fetchSSHUrl(this.props.containerSlug);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.containerSlug !== this.props.containerSlug) {
      this.fetchSSHUrl(nextProps.containerSlug);
    }
  }

  componentWillUnmount() {
    userStore.offChange(this.userStoreDidChange);
    this.refs.iframe.removeEventListener('load', this.iframeDidLoad, false);
  }

  userStoreDidChange = () => {
    this.setState({ username: userStore.username }, () => {
      this.initializeTerm();
    });
  };

  iframeDidLoad = () => {
    this._iframeLoaded = true;
    this.initializeTerm();
  };

  fetchSSHUrl(slug) {
    if (!slug) {
      return;
    }
    authedAjax({
      type: 'GET',
      url: `/api/v0/containers/${slug}`,
      dataType: 'json'
    }).then((data) => {
      this.setState({ sshUrl: data.container.ssh_url }, () => {
        this.initializeTerm();
      });
    }, (/*jqxhr*/) => {
      // TODO: failed to fetch ssh url
    });
  }

  initializeTerm() {
    const { sshUrl, username } = this.state;
    if (this._termInitialized || !sshUrl || !username || !this._iframeLoaded) {
      return;
    }
    this._termInitialized = true;

    const iframeWindow = this.refs.iframe.contentWindow;

    iframeWindow.termStart();

    let cmd = path.join(__dirname, '..', '..', 'nsync');

    if (platform.isMac) {
      cmd = path.join(cmd, 'osx64', 'nsync-ssh');
    } else if (platform.isWindows) {
      cmd = path.join(cmd, 'win32', 'nsync-ssh.exe');
    } else if (platform.isLinux) {
      cmd = path.join(cmd, 'lin64', 'nsync-ssh');
    } else {
      throw new Error("unsupported platform");
    }

    const sshMatch = sshUrl.match(/\/\/([^@]+)@([^:]+):(\d+)$/),
          sshUsername = sshMatch[1],
          sshHost = sshMatch[2],
          sshPort = sshMatch[3];

    const size = iframeWindow.termSize();
    const proc = this._proc = pty.spawn(cmd, [
      '-l', sshUsername,
      '-p', sshPort, sshHost,
      '-i', path.join(config.nitrousFolderPath, 'SSH Keys', username, 'id_rsa')
    ], {
      name: 'xterm-256color',
      cols: size.columns || 80,
      rows: size.lines || 25,
      cwd: path.dirname(cmd),
      env: iwc.getEnv()
    });

    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(evt) {
      process.on(evt, function() {
        proc.kill('SIGTERM');
      });
    });

    proc.on('close', () => {
      iframeWindow.termWrite("[Session closed]");
      this._proc = null;
    });

    proc.on('data', function(data) {
      iframeWindow.termWrite(data.toString());
    });

    iframeWindow.onTermInput = function(data) {
      proc.write(data);
    };

    iframeWindow.onTermResize = function(cols, lines) {
      proc.resize(cols, lines);
    };
  }

  render() {
    return (
      <div className='nitrogen-shell-component'>
        <iframe src='atom://nitrogen/lib/shell/shell.html' ref="iframe"></iframe>
      </div>
    );
  }
}
