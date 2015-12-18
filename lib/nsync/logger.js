'use strict';

let textarea;

function log(msg) {
  textarea = textarea || document.getElementById('nsync-log');
  const scrollToBottom = textarea.offsetHeight + textarea.scrollTop === textarea.scrollHeight;

  textarea.appendChild(document.createTextNode(msg));

  if (scrollToBottom) {
    textarea.scrollTop = textarea.scrollHeight - textarea.offsetHeight;
  }
}

module.exports = {
  log(msg) {
    log(msg);
  },

  panic(err) {
    log('\n' + err.toString());
    throw err;
  }
};
