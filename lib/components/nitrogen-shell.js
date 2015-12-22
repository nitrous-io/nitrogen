/** @babel */

import React, { PropTypes } from 'react';
import userStore from '../stores/user-store';
import platform from '../util/platform';
import iwc from '../util/iwc';
import path from 'path';
import childProcess from 'child_process';
import { authedAjax } from '../ajax';
import config from '../config';

export default class NitrogenShell extends React.Component {
  displayName = 'NitrogenShell';
  _iframeLoaded = false;
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
    this.teardown();
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
    if (!sshUrl || !username || !this._iframeLoaded) {
      return;
    }

    const iframeWindow = this.refs.iframe.contentWindow;

    iframeWindow.termStart();

    let proc = this._proc;
    if (!proc) {
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

      const size = iframeWindow.termGetSize();

      const args = [
        '-l', sshUsername,
        '-p', sshPort, sshHost,
        '-i', path.join(config.nitrousFolderPath, 'SSH Keys', username, 'id_rsa'),
        '$SHELL -l'
      ];

      const options = {
        name: 'xterm-256color',
        cols: size.columns || 80,
        rows: size.lines || 25,
        cwd: path.dirname(cmd),
        env: iwc.getEnv()
      };

      const jsPath = require.resolve('../shell/pty');

      proc = this._proc = childProcess.fork(jsPath, [], { env: options.env, cwd: options.cwd, detached: false });

      ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(evt) {
        process.on(evt, function() {
          proc.kill('SIGTERM');
        });
      });

      proc.send({ event: 'pty.start', data: { cmd, args, options }});

      proc.on('message', (msg) => {
        const iframeWindow = this.getIframeWindow();

        switch (msg.event) {
          case 'pty.close': {
            if (iframeWindow) {
              iframeWindow.termWrite("[Session closed]");
            }
            break;
          }
          case 'pty.data': {
            if (iframeWindow) {
              iframeWindow.termWrite(msg.data.toString());
            }
            break;
          }
        }
      });
    }

    iframeWindow.onTermResize = (columns, lines) => {
      const proc = this._proc;
      if (proc) {
        proc.send({ event: 'pty.resize', data: { columns, lines }});
      }
    };

    iframeWindow.onTermInput = (data) => {
      const proc = this._proc;
      if (proc) {
        proc.send({ event: 'pty.input', data });
      }
    };

    iframeWindow.termSizeToFit();
  }

  getIframeWindow() {
    return this.refs.iframe && this.refs.iframe.contentWindow;
  }

  teardown() {
    const iframeWindow = this.getIframeWindow();
    if (iframeWindow) {
      iframeWindow.onTermInput = null;
      iframeWindow.onTermResize = null;
      iframeWindow.onTermTitle = null;
    }

    const proc = this._proc;
    if (proc) {
      proc.send({ event: 'pty.quit' });
    }
    this._proc = null;
  }

  render() {
    return (
      <div className='nitrogen-shell-component'>
        <iframe src='atom://nitrogen/lib/shell/shell.html' ref="iframe"></iframe>
      </div>
    );
  }
}
