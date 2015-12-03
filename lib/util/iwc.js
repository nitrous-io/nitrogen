// using common-js module syntax and limited ES6 as this module is used by
// nsync-runner as well and it isn't babel-compiled.

const ipc = require('ipc'),
      remote = require('remote'),
      BrowserWindow = remote.require('browser-window'),
      mainProcess = remote.getGlobal('process');

module.exports = {
  send(event, ...args) {
    const thisWinId = remote.getCurrentWindow().id;
    BrowserWindow.getAllWindows().forEach((win) => {
      if (thisWinId !== win.id) {
        win.webContents.send(`nitrogen:nsync:${event}`, ...args);
      }
    });
  },

  on(event, callback) {
    ipc.on(`nitrogen:nsync:${event}`, callback);
  },

  setEnv(key, value) {
    mainProcess.env = Object.assign({}, mainProcess.env, { [key]: value });
    return value;
  },

  getEnv(key) {
    if (arguments.length === 0) {
      return mainProcess.env;
    }
    return mainProcess.env[key];
  }
};
