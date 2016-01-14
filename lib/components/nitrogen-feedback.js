/** @babel */

import React from 'react';
import ReactDOM from 'react-dom';
import { authedAjax } from '../ajax';
import TextField from './text-field';
import TextArea from './text-area';
import emitter from '../emitter';
import snackbarActions from '../actions/snackbar-actions';
import nsyncStore from '../stores/nsync-store';

export default class NitrogenFeedback extends React.Component {
  displayName = 'NitrogenFeedback';

  state = {
    submitting: false
  };

  handleClickSendFeedback = () => {
    const { subjectField, messageField } = this.refs,
          subject = subjectField.getValue(),
          message = messageField.getValue();

    if (!subject || !message) {
      return;
    }

    this.setState({ submitting: true });

    authedAjax({
      type: 'POST',
      url: '/api/v0/feedback',
      dataType: 'json',
      data: {
        subject,
        body: this.messagePrefix() + message,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    }).then(() => {
      const { subjectField, messageField } = this.refs;
      subjectField.setValue('');
      messageField.setValue('');
      this.setState({ submitting: false });
      emitter.emit('hide-feedback-dialog');
      snackbarActions.post('Thank you for your feedback.');
    }, () => {
      this.setState({ submitting: false });
      snackbarActions.post('Failed to submit your feedback. Please try again');
    });
  };

  handleKeyDown = (e) => {
    const { subjectField, messageField, feedbackSubmitBtn } = this.refs;
    let nextEl = null, prevEl = null;

    if (e.target === ReactDOM.findDOMNode(subjectField)) {
      prevEl = feedbackSubmitBtn;
      nextEl = messageField;
    } else if (e.target === ReactDOM.findDOMNode(messageField)) {
      prevEl = subjectField;
      nextEl = feedbackSubmitBtn;
    }

    if (!prevEl || !nextEl) {
      return;
    }

    if (e.keyCode === 9) { // Tab
      process.nextTick(() => {
        if (e.shiftKey) {
          prevEl.focus();
        } else {
          nextEl.focus();
        }
      });
    }
  };

  focusTitle() {
    const { subjectField } = this.refs;
    window.setTimeout(function() {
      subjectField.select();
      subjectField.focus();
    }, 10);
  }

  messagePrefix() {
    let message = "[Environment]\n";

    const packages = atom.packages.loadedPackages;
    const installedPackages = [];
    let nitrogenInfo = null;
    for (const i in packages) {
      const p = packages[i];
      if (p.name.toLowerCase() === 'nitrogen') {
        nitrogenInfo = p;
        continue;
      }

      if (!p.bundledPackage) {
        installedPackages.push(p);
      }
    }

    message += `Nitrogen: ${nitrogenInfo.metadata.version}\n`;
    installedPackages.forEach( (p) => {
      message += `${p.name}: ${p.metadata.version}\n`;
    });

    if (nsyncStore.nsyncVersion) {
      message += `Nsync: ${nsyncStore.nsyncVersion}\n`;
    }

    if (nsyncStore.nsyncSSHVersion) {
      message += `Nsync SSH: ${nsyncStore.nsyncSSHVersion}\n`;
    }

    message += "\n[Message]\n";
    return message;
  }

  render() {
    const submitting = this.state.submitting,
          submitLabel = submitting ? 'Submitting...' : 'Submit';

    /*eslint-disable react/no-danger*/
    return (
      <div className='nitrogen-feedback-component'>
        <h3 className='icon icon-issue-opened'>Send Feedback</h3>
        <TextField ref='subjectField' placeholder="Subject" onKeyDown={this.handleKeyDown}/>
        <TextArea ref='messageField' placeholder="Message" onKeyDown={this.handleKeyDown} className='text-area'/>
        <div className='btn-wrap-group'>
          <button ref='feedbackSubmitBtn' className='btn btn-primary btn-block' onClick={this.handleClickSendFeedback}
            disabled={submitting}>{submitLabel}</button>
        </div>
      </div>
    );
    /*eslint-enable react/no-danger*/
  }
}
