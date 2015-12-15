module.exports = {
  _textarea: null,

  log(msg) {
    const textarea = this._textarea ? this._textarea : document.getElementById('nsync-log'),
          scrollToBottom = textarea.offsetHeight + textarea.scrollTop === textarea.scrollHeight;

    textarea.appendChild(document.createTextNode(msg));

    if (scrollToBottom) {
      textarea.scrollTop = textarea.scrollHeight - textarea.offsetHeight;
    }
  },

  panic(err) {
    this.log('\n' + err.toString());
    throw err;
  }
};
