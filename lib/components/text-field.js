/** @babel */

import React, { PropTypes } from 'react';
import classNames from 'classnames';

export default class TextField extends React.Component {
  displayName = 'TextField';

  _changeDisposable = null;

  static propTypes = {
    className: PropTypes.string,
    onChange: PropTypes.func,
    onKeyDown: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    secure: PropTypes.bool,
    placeholder: PropTypes.string,
    value: PropTypes.string
  };

  static defaultProps = {
    secure: false
  };

  componentDidMount() {
    const { editor } = this.refs,
          { value, secure } = this.props,
          model = editor.getModel();

    editor.addEventListener('keydown', this.handleKeyDown, false);
    editor.addEventListener('focus', this.handleFocus, false);
    editor.addEventListener('blur', this.handleBlur, false);

    const maskText = function(text) {
      let maskedText = editor.shadowRoot.querySelector('.masked-text');
      if (!maskedText) {
        maskedText = document.createElement('style');
        maskedText.className = 'masked-text';
        editor.shadowRoot.appendChild(maskedText);
      }
      maskedText.innerText = `
        .line:before { content: "${text.replace(/./g, '\u2022')}" }
      `;
    };

    if (value) {
      this.setValue(value);
      if (secure) {
        maskText(value);
      }
    }

    this._changeDisposable = model.onDidChange(() => {
      const text = model.getText(),
            { onChange, secure } = this.props;

      if (secure) {
        maskText(text);
      }

      if (typeof onChange === 'function') {
        onChange(text);
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value && !nextProps.value) {
      this.setValue('');
    } else if (nextProps.value && nextProps.value !== this.getValue()) {
      this.setValue(nextProps.value);
    }
  }

  componentWillUnmount() {
    if (this._changeDisposable) {
      this._changeDisposable.dispose();
    }

    const { editor } = this.refs;
    editor.removeEventListener('keydown', this.handleKeyDown, false);
    editor.removeEventListener('focus', this.handleFocus, false);
    editor.removeEventListener('blur', this.handleBlur, false);
  }

  getValue() {
    const model = this.refs.editor.getModel();
    if (model) {
      return model.getText();
    }
    return '';
  }

  setValue(text) {
    const model = this.refs.editor.getModel();
    if (model) {
      model.setText(text);
    }
  }

  focus() {
    this.refs.editor.focus();
  }

  select() {
    this.refs.editor.getModel().selectAll();
  }

  handleKeyDown = (e) => {
    const { onKeyDown } = this.props;
    if (typeof onKeyDown === 'function') {
      onKeyDown(e);
    }
  };

  handleFocus = (e) => {
    const { onFocus } = this.props;
    if (typeof onFocus === 'function') {
      onFocus(e);
    }
  };

  handleBlur = (e) => {
    const { onBlur } = this.props;
    if (typeof onBlur === 'function') {
      onBlur(e);
    }
  };

  render() {
    /*eslint-disable react/no-unknown-property*/ // atom-text-editor is not an HTML5 DOM element, so 'className' does not work.
    return (
      <atom-text-editor ref='editor'
        class={classNames(this.props.className, { 'secure-text-field': this.props.secure })}
        mini data-garammar='text plain null-grammar'
        placeholder-text={this.props.placeholder} />
    );
    /*eslint-enable react/no-unknown-property*/
  }
}
