/** @babel */

import React, { PropTypes } from 'react';
import { CompositeDisposable } from 'atom';
import userStore from '../stores/user-store';
import iwc from '../util/iwc';
import path from 'path';
import childProcess from 'child_process';
import { authedAjax } from '../ajax';
import config from '../config';
import clipboard from 'clipboard';
import classNames from 'classnames';
import bins from '../bins';
import emitter from '../emitter';
import nsyncStore from '../stores/nsync-store';

export default class NitrogenShell extends React.Component {
  displayName = 'NitrogenShell';
  _iframeLoaded = false;
  _sshKeyRegistered = false;
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
    this.registerSSHKey(this.props.containerSlug);
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

    emitter.on('deactivate', this.killProc);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.containerSlug !== this.props.containerSlug) {
      this.fetchSSHUrl(nextProps.containerSlug);
      this.registerSSHKey(nextProps.containerSlug);
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

  registerSSHKey(slug) {
    if (slug) {
      const onSSHKeyRegistered = (containerSlug) => {
        if (slug === containerSlug) {
          iwc.off('nsync.ssh-key-registered', onSSHKeyRegistered);
          this._sshKeyRegistered = true;
          this.initializeTerm();
        }
      };
      iwc.on('nsync.ssh-key-registered', onSSHKeyRegistered);

      if (nsyncStore.running) {
        // if nsync is running, send register-ssh-key command
        iwc.send('nsync.register-ssh-key', slug);
      } else {
        // if nsync is not yet running, wait for it to start
        iwc.once('nsync-runner.server-running', function() {
          // and then send the register-ssh-key command
          iwc.send('nsync.register-ssh-key', slug);
        });
      }
    }
  }

  initializeTerm() {
    const { sshUrl, username } = this.state;
    if (!sshUrl || !username || !this._sshKeyRegistered || !this._iframeLoaded) {
      return;
    }

    const iframeWindow = this.getIframeWindow();

    this.setFont();

    iframeWindow.termStart();

    let proc = this._proc;
    if (!proc) {
      const sshMatch = sshUrl.match(/\/\/([^@]+)@([^:]+):(\d+)$/),
            sshUsername = sshMatch[1],
            sshHost = sshMatch[2],
            sshPort = sshMatch[3];

      const size = iframeWindow.termGetSize();

      const cmd = bins.nsyncSsh;

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
        const iframeWindow = this.getIframeWindow(),
              { containerSlug } = this.props;
        if (iframeWindow) {
          iframeWindow.termWrite(data.toString());
        }

        // This is to extend the workstation active time while using shell
        iwc.send('nsync.ping', containerSlug);
      });

      proc.stderr.on('data', (data) => {
        const iframeWindow = this.getIframeWindow(),
              { containerSlug } = this.props;
        if (iframeWindow) {
          iframeWindow.termWrite(data.toString());
        }

        // This is to extend the workstation active time while using shell
        iwc.send('nsync.ping', containerSlug);
      });
    }

    iframeWindow.onTermResize = (columns, lines) => {
      const proc = this._proc;
      if (proc && proc.stdin && proc.stdin.writable) {
        // send resize request by sending ansi resize code
        proc.stdin.write(`\x1b[8;${lines};${columns}t`);
      }
    };

    iframeWindow.onTermInput = (data) => {
      const proc = this._proc,
            { containerSlug } = this.props;
      if (proc && proc.stdin && proc.stdin.writable) {
        proc.stdin.write(data);
      }

      // This is to extend the workstation active time while using shell
      iwc.send('nsync.ping', containerSlug);
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
      // When you copy from terminal, space character(ascii 32) becomes ascii 160
      // So if you copy and paste any commands with spaces on terminal,
      // it would not work because it considers the command as one word.
      // This is to prevent not to copy ascii 160 from terminal.
      const spaceChar = String.fromCharCode(160);
      const regex = new RegExp(`${spaceChar}`, 'g');
      clipboard.writeText(str.replace(regex, ' '));
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
