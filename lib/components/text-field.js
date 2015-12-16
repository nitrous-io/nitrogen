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
    secure: PropTypes.bool,
    placeholder: PropTypes.string,
    initialValue: PropTypes.string
  };

  static defaultProps = {
    secure: false
  };

  componentDidMount() {
    const { editor } = this.refs;

    this.refs.editor.addEventListener('keydown', this.handleKeyDown, false);

    editor.onDidAttach(() => {
      const model = editor.getModel();
      if (this.props.initialValue) {
        this.setValue(this.props.initialValue);
      }

      this._changeDisposable = model.onDidChange(() => {
        const text = model.getText();

        if (this.props.secure) {
          let maskedText = editor.shadowRoot.querySelector('.masked-text');
          if (!maskedText) {
            maskedText = document.createElement('style');
            maskedText.className = 'masked-text';
            editor.shadowRoot.appendChild(maskedText);
          }
          maskedText.innerText = `
            .line:before { content: "${text.replace(/./g, '\u2022')}" }
          `;
        }

        if (typeof this.props.onChange === 'function') {
          this.props.onChange(text);
        }
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.initialValue !== this.props.initialValue) {
      this.setValue(nextProps.initialValue);
    }
  }

  componentWillUnmount() {
    if (this._changeDisposable) {
      this._changeDisposable.dispose();
    }

    this.refs.editor.removeEventListener('keydown', this.handleKeyDown, false);
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
    if (typeof this.props.onKeyDown === 'function') {
      this.props.onKeyDown(e);
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
