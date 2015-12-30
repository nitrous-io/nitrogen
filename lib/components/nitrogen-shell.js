/** @babel */

import React, { PropTypes } from 'react';
import { CompositeDisposable } from 'atom';
import userStore from '../stores/user-store';
import platform from '../util/platform';
import iwc from '../util/iwc';
import path from 'path';
import childProcess from 'child_process';
import { authedAjax } from '../ajax';
import config from '../config';
import remote from 'remote';
import classNames from 'classnames';

const clipboard = remote.require('clipboard');

export default class NitrogenShell extends React.Component {
  displayName = 'NitrogenShell';
  _iframeLoaded = false;
  _proc = null;

  _subscriptions = null;

  static propTypes = {
    containerSlug: PropTypes.string,
    onTitleChange: PropTypes.func
  };

  state = {
    sshUrl: null,
    username: userStore.username,
    cover: false
  };

  componentDidMount() {
    userStore.onChange(this.userStoreDidChange);
    this.refs.iframe.addEventListener('load', this.iframeDidLoad, false);
    this.fetchSSHUrl(this.props.containerSlug);
    this._subscriptions = new CompositeDisposable();

    this._subscriptions.add(
      atom.config.onDidChange('editor.fontFamily', this.setFont)
    );
    this._subscriptions.add(
      atom.config.onDidChange('editor.fontSize', this.setFont)
    );
    this._subscriptions.add(
      atom.config.onDidChange('editor.lineHeight', this.setFont)
    );

    process.setMaxListeners(200);
    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach((evt) => {
      process.on(evt, this.killProc);
    });
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
    this._subscriptions.dispose();

    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach((evt) => {
      process.removeListener(evt, this.killProc);
    });
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

    const iframeWindow = this.getIframeWindow();

    this.setFont();

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
        '-i', path.join(config.nitrousFolderPath, 'SSH Keys', username, 'id_rsa').replace(/ /g, Array(6).join(path.sep)),
        '-z',
        '$SHELL', '-l'
      ];

      const options = {
        name: 'xterm-256color',
        cols: size.columns || 80,
        rows: size.lines || 25,
        cwd: path.dirname(cmd),
        env: Object.assign({}, iwc.getEnv(), { TERM: 'xterm-256color' })
      };

      proc = this._proc = childProcess.spawn(cmd, args, options);

      proc.on('close', () => {
        const iframeWindow = this.getIframeWindow();
        if (iframeWindow) {
          iframeWindow.termWrite("[Session closed]");
        }
      });

      proc.stdout.on('data', (data) => {
        const iframeWindow = this.getIframeWindow();
        if (iframeWindow) {
          iframeWindow.termWrite(data.toString());
        }
      });

      proc.stderr.on('data', (data) => {
        const iframeWindow = this.getIframeWindow();
        if (iframeWindow) {
          iframeWindow.termWrite(data.toString());
        }
      });
    }

    iframeWindow.onTermResize = (columns, lines) => {
      const proc = this._proc;
      if (proc) {
        // send resize request by sending ansi resize code
        proc.stdin.write(`\x1b[8;${lines};${columns}t`);
      }
    };

    iframeWindow.onTermInput = (data) => {
      const proc = this._proc;
      if (proc) {
        proc.stdin.write(data);
      }
    };

    iframeWindow.onTermTitle = (title) => {
      const { onTitleChange } = this.props;
      if (typeof onTitleChange === 'function') {
        onTitleChange(title);
      }
    };

    iframeWindow.onKeyPrevTab = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), "pane:show-previous-item");
    };

    iframeWindow.onKeyNextTab = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), "pane:show-next-item");
    };

    iframeWindow.onKeyCloseTab = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), "tabs:close-tab");
    };

    iframeWindow.onKeyCloseWindow = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), "window:close");
    };

    /* disabled for now
    iframeWindow.onKeyNewTab = () => {
      const { containerSlug } = this.props;
      if (containerSlug) {
        emitter.emit('show-shell', containerSlug);
      }
    };
    */

    iframeWindow.onKeyNewWindow = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), "application:new-window");
    };

    iframeWindow.onCopy = function(str) {
      clipboard.writeText(str);
    };

    iframeWindow.onPaste = function() {
      return clipboard.readText();
    };

    let resizeTimeout = null;
    iframeWindow.onWindowResize = () => {
      window.clearTimeout(resizeTimeout);
      if (!this.state.cover) {
        this.setState({ cover: true });
      }
      resizeTimeout = window.setTimeout(() => {
        this.setState({ cover: false });
      }, 300);
    };

    iframeWindow.termSizeToFit();
  }

  getIframeWindow() {
    return this.refs.iframe && this.refs.iframe.contentWindow;
  }

  setFont = () => {
    const iframeWindow = this.getIframeWindow();
    if (atom.config && atom.config.settings && atom.config.settings.editor) {
      const e = atom.config.settings.editor;
      iframeWindow.termSetFont(e.fontFamily, e.fontSize, e.lineHeight);
    }
  };

  killProc = () => {
    const proc = this._proc;
    if (proc) {
      proc.kill('SIGTERM');
    }
  };

  focusShell() {
    const iframeWindow = this.getIframeWindow();
    if (iframeWindow) {
      iframeWindow.focus();
    }
  }

  teardown() {
    const iframeWindow = this.getIframeWindow();
    if (iframeWindow) {
      iframeWindow.onTermInput = null;
      iframeWindow.onTermResize = null;
      iframeWindow.onTermTitle = null;
      iframeWindow.onKeyPrevTab = null;
      iframeWindow.onKeyNextTab = null;
      iframeWindow.onKeyCloseTab = null;
      iframeWindow.onKeyCloseWindow = null;
      /* disabled for now
      iframeWindow.onKeyNewTab = null;
      */
      iframeWindow.onKeyNewWindow = null;
      iframeWindow.onCopy = null;
      iframeWindow.onPaste = null;
      iframeWindow.onWindowResize = null;
    }

    const proc = this._proc;
    if (proc && proc.connected) {
      proc.send({ event: 'pty.quit' });
    }
    this._proc = null;
  }

  render() {
    const { cover } = this.state;

    return (
      <div className={classNames('nitrogen-shell-component', { cover })}>
        <iframe src='atom://nitrogen/lib/shell/shell.html' ref="iframe"></iframe>
      </div>
    );
  }
}
