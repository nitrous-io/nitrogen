/** @babel */

import './polyfill';

import NitrogenToolbarElement from './elements/nitrogen-toolbar-element';
import { CompositeDisposable } from 'atom';
import path from 'path';
import remote from 'remote';
import welcome from './welcome';
import login from './login';
import containerSettings from './container-settings';
import shell from './shell';
import webview from './webview';
import renameWatcher from './rename-watcher';
import feedback from './feedback';
import nsyncStore from './stores/nsync-store';
import tokenStore from './stores/token-store';
import userActions from './actions/user-actions';
import hostActions from './actions/host-actions';
import containerActions from './actions/container-actions';
import orgActions from './actions/org-actions';
import nsyncRunnerBootstrap from './nsync/nsync-runner-bootstrap';
import iwc from './util/iwc';
import config from './config';
import emitter from './emitter';
import './bins'; // ensures bins are copied before nsync is loaded

const BrowserWindow = remote.require('browser-window'),
      ignoredFilePatterns = [".unison", ".git", ".svn", ".hg", "CVS", ".DS_Store", ".AppleDouble", ".LSOverride", ".Spotlight-V100", ".Trashes", "Thumbs.db", "desktop.ini", "*.lock", "*.sock", "*.pid", "*.sw?", ".unison*", "._*", "*~"];

class Nitrogen {
  subscriptions = null;

  toolbarEl = null;
  toolbarPanel = null;

  config = {
    showWelcomeOnStartup: {
      type: 'boolean',
      default: true,
      description: 'Show the welcome screen the next time a new window is created. This config setting is automatically set to `false` after a new window is created and welcome screen is shown.'
    }
  };

  activate(state) {
    this.openNsyncRunner();

    this.subscriptions = new CompositeDisposable();

    this.toolbarEl = new NitrogenToolbarElement();
    this.toolbarEl.deserialize(state.toolbarState);

    this.toolbarPanel = atom.workspace.addRightPanel({
      item: this.toolbarEl,
      visible: true
    });

    welcome.activate();
    login.activate();
    containerSettings.activate();
    shell.activate();
    webview.activate();
    renameWatcher.activate();
    feedback.activate();

    this.tokenStoreDidChange();
    tokenStore.onChange(this.tokenStoreDidChange);
    nsyncStore.onChange(this.nsyncStoreDidChange);
    window.addEventListener('online', this.connectionDidReconnect, false);

    this.addIgnoredFiles();
  }

  deactivate() {
    emitter.emit('deactivate');
    window.removeEventListener('online', this.connectionDidReconnect, false);

    tokenStore.offChange(this.tokenStoreDidChange);
    nsyncStore.offChange(this.nsyncStoreDidChange);

    this.toolbarPanel.destroy();
    this.toolbarEl.destroy();
    welcome.deactivate();
    login.deactivate();
    containerSettings.deactivate();
    shell.deactivate();
    webview.deactivate();
    renameWatcher.deactivate();
    feedback.deactivate();

    this.subscriptions.dispose();
  }

  serialize() {
    return {
      toolbarState: this.toolbarEl.serialize()
    };
  }

  fetchAll() {
    if (tokenStore.token) {
      userActions.fetch().then(function() {
        hostActions.fetchAll();
        containerActions.fetchAll();
        orgActions.fetchAll();
      });
    }
  }

  connectionDidReconnect = () => {
    this.fetchAll();
  };

  tokenStoreDidChange = () => {
    this.fetchAll();
    this.runNsyncServerIfNeeded();
  };

  nsyncStoreDidChange = () => {
    this.runNsyncServerIfNeeded();
  };

  runNsyncServerIfNeeded = () => {
    const { token } = tokenStore,
          { runnerReady, running } = nsyncStore;

    if (token && runnerReady && !running) {
      iwc.send('nsync-runner.start-server', config.nitrousHost, token, config.nitrousFolderPath);
    }
  };

  openNsyncRunner() {
    // this isn't sufficient to prevent race condition, so nsync-runner does its own checks
    if (!iwc.getEnv('NSYNC_RUNNING')) {
      iwc.setEnv('NSYNC_RUNNING', true);

      let win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        "web-preferences": {
          "web-security": false
        }
      });

      win.on('closed', function() {
        win = null;
      });

      win.loadUrl('atom://nitrogen/lib/nsync/nsync-runner.html');

      win.webContents.once('dom-ready', () => {
        const escapePath = function(p) {
          return "'" + p.replace(/\\/g, '\\\\').replace("'", "\\'") + "'";
        };

        // inject nsync-runner bootstrap
        const nsyncRunnerPath = require.resolve('./nsync/nsync-runner-bootstrap'),
              nodeModulesPath = path.join(__dirname, '..', 'node_modules'),
              code = `(${nsyncRunnerBootstrap.toString()})(${escapePath(nsyncRunnerPath)}, ${escapePath(nodeModulesPath)});`;

        win.webContents.executeJavaScript(code);
      });
    }
  }

  addIgnoredFiles() {
    const ignoredNames = atom.config.get('core.ignoredNames') || [];
    ignoredFilePatterns.forEach((ignoredFilePattern) => {
      if (!ignoredNames.includes(ignoredFilePattern)) {
        ignoredNames.push(ignoredFilePattern);
      }
    });

    atom.config.set('core.ignoredNames', ignoredNames);
    atom.config.set('tree-view.hideIgnoredNames', false);
    atom.config.set('tree-view.hideIgnoredNames', true);
  }
}

atom.config.set('welcome.showOnStartup', false);

export default new Nitrogen();
