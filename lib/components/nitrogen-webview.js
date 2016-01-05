/** @babel */

import React, { PropTypes } from 'react';
import { CompositeDisposable } from 'atom';
import TextField from './text-field';
import shell from 'shell';
import emitter from '../emitter';
import URL from 'url';
import NitrogenLoading from './nitrogen-loading';

export default class NitrogenWebview extends React.Component {
  displayName = 'NitrogenWebview';

  _subscriptions = null;

  static propTypes = {
    url: PropTypes.string,
    onTitleChange: PropTypes.func
  };

  state = {
    loading: false,
    canGoBack: false,
    canGoForward: false
  };

  componentDidMount() {
    this._subscriptions = new CompositeDisposable();
    const { webview, urlField } = this.refs,
          { url } = this.props;

    if (url) {
      urlField.setValue(url);
      this.loadUrl(url);
    }

    webview.addEventListener('did-start-loading', this.handleDidStartLoading, false);
    webview.addEventListener('did-stop-loading', this.handleDidStopLoading, false);
    webview.addEventListener('page-title-set', this.handlePageTitleSet, false);
    webview.addEventListener('new-window', this.handleNewWindow, false);
    webview.addEventListener('load-commit', this.handleLoadCommit, false);
  }

  componentWillReceiveProps(nextProps) {
    const { url } = nextProps;
    if (url && (url !== this.props.url)) {
      this.refs.urlField.setValue(url);
      this.loadUrl(url);
    }
  }

  componentWillUnmount() {
    this._subscriptions.dispose();

    const { webview } = this.refs;
    webview.removeEventListener('did-start-loading', this.handleDidStartLoading, false);
    webview.removeEventListener('did-stop-loading', this.handleDidStopLoading, false);
    webview.removeEventListener('page-title-set', this.handlePageTitleSet, false);
    webview.removeEventListener('new-window', this.handleNewWindow, false);
    webview.removeEventListener('load-commit', this.handleLoadCommit, false);
  }

  loadUrl(url) {
    this.refs.webview.src = url || 'about:blank';
  }

  setTitle(title) {
    const { onTitleChange } = this.props;
    if (typeof onTitleChange === 'function') {
      onTitleChange(title);
    }
  }

  handleDidStartLoading = () => {
    this.setState({ loading: true });
  };

  handleDidStopLoading = () => {
    const { webview } = this.refs;
    this.setTitle(webview.getTitle());
    this.setState({
      loading: false,
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward()
    });
  };

  handlePageTitleSet = (e) => {
    this.setTitle(e.title);
  };

  handleClickBack = () => {
    this.refs.webview.goBack();
  };

  handleClickForward = () => {
    this.refs.webview.goForward();
  };

  handleClickStop = () => {
    this.refs.webview.stop();
  };

  handleClickReload = (e) => {
    const { webview } = this.refs;
    if (e.altKey) {
      webview.reloadIgnoringCache();
    } else {
      webview.reload();
    }
  };

  handleClickOpenExternally = () => {
    shell.openExternal(this.refs.webview.getUrl());
  };

  handleClickOpenDevTools = () => {
    this.refs.webview.openDevTools();
  };

  handleLoadCommit = (e) => {
    if (e.isMainFrame) {
      this.refs.urlField.setValue(e.url);
    }
  };

  handleNewWindow = (e) => {
    emitter.emit('show-webview', e.url);
  };

  handleTextFieldFocus = () => {
    this.refs.urlField.select();
  };

  handleTextFieldBlur = () => {
    this.refs.urlField.unselect();
  };

  handleTextFieldKeyDown = (e) => {
    const { urlField } = this.refs;
    if (e.keyCode === 13) {
      urlField.unselect();
      urlField.blur();
      let url = urlField.getValue();
      const u = URL.parse(url);
      if (!(u.protocol && u.slashes)) {
        url = 'http://' + url;
      }
      this.loadUrl(url);
    }
  };

  render() {
    const { loading, canGoBack, canGoForward } = this.state;

    return (
      <div className='nitrogen-webview-component'>
        <div className='nitrogen-webview-toolbar'>
          <div className='btn-group'>
            <button className='btn btn-default icon icon-arrow-left' title='Go Back' onClick={this.handleClickBack} disabled={!canGoBack} />
            <button className='btn btn-default icon icon-arrow-right' title='Go Forward' onClick={this.handleClickForward} disabled={!canGoForward} />
          </div>
          {loading ? (
            <button className='btn btn-default icon icon-x' title='Stop navigation' onClick={this.handleClickStop} />
          ) : (
            <button className='btn btn-default icon icon-sync' title='Reload this page' onClick={this.handleClickReload} />
          )}
          <TextField ref='urlField' onFocus={this.handleTextFieldFocus} onBlur={this.handleTextFieldBlur} onKeyDown={this.handleTextFieldKeyDown} />
          {loading ? (
            <NitrogenLoading />
          ) : ''}
          <button className='btn btn-default icon icon-link-external' title='Open in external browser...' onClick={this.handleClickOpenExternally} />
          <button className='btn btn-default icon icon-tools' title='Open Developer Tools...' onClick={this.handleClickOpenDevTools} />
        </div>
        <div className='nitrogen-webview'>
          <webview ref="webview" allowpopups />
        </div>
      </div>
    );
  }
}

