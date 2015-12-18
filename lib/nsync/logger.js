'use strict';

let textarea,
    scrollback = 200;

function log(msg) {
  textarea = textarea || document.getElementById('nsync-log');
  const scrollToBottom = textarea.clientHeight + textarea.scrollTop >= textarea.scrollHeight;

  while (textarea.childNodes.length >= scrollback) {
    textarea.removeChild(textarea.firstChild);
  }

  textarea.appendChild(document.createTextNode(msg));

  if (scrollToBottom) {
    textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
  }
}

module.exports = {
  log(msg) {
    log(msg);
  },

  panic(err) {
    log('\n' + err.toString());
  },

  setScrollback(n) {
    scrollback = n;
  }
};
