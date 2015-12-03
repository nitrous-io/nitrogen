/** @babel */

import 'babel/polyfill';

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';
import path from 'path';
import remote from 'remote';
import welcome from './welcome';
import login from './login';
import tokenStore from './stores/token-store';
import tokenActions from './actions/token-actions';
import userActions from './actions/user-actions';
import nsyncRunner from './nsync-runner';
import iwc from './util/iwc';
import stringUtil from './util/string-util';

const BrowserWindow = remote.require('browser-window');

class Nitrogen {
  subscriptions = null;

  toolbarEl = null;
  toolbarPanel = null;

  config = {
    showWelcomeOnStartup: {
      type: 'boolean',
      default: true,
      description: 'Show the welcome screen the next time a new window is created. This config setting is automatically set to `false` after a new window is created and welcome screen is shown.'
    },
    nitrousHost: {
      type: 'string',
      default: 'https://www.nitrous.io',
      description: 'Hostname for Nitrous'
    }
  };

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.toolbarEl = new NitrogenToolbarElement();
    this.toolbarEl.deserialize(state.toolbarState);

    this.toolbarPanel = atom.workspace.addLeftPanel({
      item: this.toolbarEl,
      visible: true
    });

    welcome.activate();
    login.activate();

    this.handleIwc();
    this.openNsyncRunner();

    if (tokenStore.token) {
      userActions.fetch();
    }
  }

  deactivate() {
    this.toolbarPanel.destroy();
    this.toolbarEl.destroy();
    welcome.deactivate();
    login.deactivate();

    this.subscriptions.dispose();
  }

  serialize() {
    return {
      toolbarState: this.toolbarEl.serialize()
    };
  }

  openNsyncRunner() {
    // this isn't sufficient to prevent race condition, so nsync-runner does its own checks
    if (!iwc.getEnv('NSYNC_RUNNING')) {
      iwc.setEnv('NSYNC_RUNNING', true);

      let win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false
      });

      win.on('closed', function() {
        win = null;
      });

      win.loadUrl('atom://nitrogen/lib/nsync-runner.html');

      win.webContents.once('dom-ready', () => {
        const escapePath = function(p) {
          return "'" + p.replace(/\\/g, '\\\\').replace("'", "\\'") + "'";
        };

        const nsyncRunnerPath = require.resolve('./nsync-runner'),
              nodeModulesPath = path.join(__dirname, '..', 'node_modules'),
              code = `(${nsyncRunner.toString()})(${escapePath(nsyncRunnerPath)}, ${escapePath(nodeModulesPath)});`;

        win.webContents.executeJavaScript(code);
      });
    }
  }

  handleIwc() {
    iwc.on('nitrous-token.fetched', function(token) {
      tokenActions.dispatchTokenWithoutBroadcast(token);
    });

    iwc.on('nitrous-token.invalidate', function(kind) {
      tokenActions.invalidateWithoutBroadcast(kind);
    });

    iwc.on('nsync-runner.ready', function() {

    });

    const nsyncServerPort = stringUtil.atoi(iwc.getEnv('NSYNC_PORT'));
    if (nsyncServerPort) {
      console.log('nsync server already running at ', nsyncServerPort);
    }

    iwc.on('nsync-server.ready', function(port) {
      console.log('nsync server is ready at ', port);
    });
  }
}

atom.config.set('welcome.showOnStartup', false);

export default new Nitrogen();
