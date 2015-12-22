'use strict';

let textarea,
    printTimeout = null,
    scrollback = 200,
    messages = [];

const printInterval = 500,
      maxPrintSize = 50;

function log(msg) {
  messages.push(msg);

  if (!printTimeout) {
    printTimeout = setTimeout(print, printInterval);
  }
}

function print() {
  const logs = messages.slice(0, maxPrintSize);
  messages = messages.slice(maxPrintSize);

  textarea = textarea || document.getElementById('nsync-log');
  const scrollToBottom = textarea.clientHeight + textarea.scrollTop >= textarea.scrollHeight;

  while (textarea.childNodes.length + messages.length >= scrollback) {
    textarea.removeChild(textarea.firstChild);
  }

  logs.forEach((msg) => {
    textarea.appendChild(document.createTextNode(msg));

    if (scrollToBottom) {
      textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
    }
  });

  printTimeout = messages.length > 0 ? setTimeout(print, printInterval) : null;
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

