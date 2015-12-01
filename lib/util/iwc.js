// using common-js module syntax and limited ES6 as this module is used by
// nsync-runner as well and it isn't babel-compiled.

const ipc = require('ipc'),
      remote = require('remote'),
      BrowserWindow = remote.require('browser-window');

module.exports = {
  send(event, ...args) {
    BrowserWindow.getAllWindows().map((win) => win.webContents).forEach((wc) => {
      wc.send(`nitrogen:nsync:${event}`, ...args);
    });
  },

  on(event, callback) {
    ipc.on(`nitrogen:nsync:${event}`, callback);
  }
};
