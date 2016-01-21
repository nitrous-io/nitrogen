/** @babel */

import NitrogenFeedbackElement from './elements/nitrogen-feedback-element';
import { CompositeDisposable } from 'atom';
import emitter from './emitter';
import $ from 'jquery';

class Feedback {
  subscriptions = null;
  modalPanel = null;

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.feedbackEl = new NitrogenFeedbackElement();

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'nitrogen:show-feedback-dialog': () => {
          this.show();
        }
      })
    );

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.feedbackEl,
      visible: false
    });

    this.subscriptions.add(
      this.modalPanel.onDidChangeVisible(this.handleModalPanelDidChangeVisible)
    );

    emitter.on('hide-feedback-dialog', this.hide);
  }

  deactivate() {
    emitter.off('hide-feedback-dialog', this.hide);

    this.feedbackEl.destroy();
    this.subscriptions.dispose();
  }

  handleModalPanelDidChangeVisible = (visible) => {
    if (visible) {
      $('body').on('click.nitrogen-feedback', (e) => {
        if ($(e.target).closest('nitrogen-feedback').length === 0) {
          this.hide();
          return;
        }
      }).on('keydown.nitrogen-feedback', (e) => {
        if (e.keyCode === 27) {
          this.hide();
        }
      });
      this.feedbackEl.component.focusTitle();
    } else {
      $('body').off('click.nitrogen-feedback').off('keydown.nitrogen-feedback');
    }
  };

  show = () => {
    this.modalPanel.show();
  }

  hide = () => {
    this.modalPanel.hide();
  };
}

export default new Feedback();
