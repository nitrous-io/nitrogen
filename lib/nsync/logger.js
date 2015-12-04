module.exports = {
  _textarea: null,

  log(msg) {
    const textarea = this._textarea ? this._textarea : document.getElementById('nsync-log');
    textarea.appendChild(document.createTextNode(msg));
  },

  panic(err) {
    this.log('\n' + err.toString());
    throw err;
  }
};
