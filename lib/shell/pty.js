(function() {
  'use strict';

  const pty = require('ptyw.js');
  let proc = null;

  function ptyStart(cmd, args, options) {
    if (proc) {
      return;
    }
    proc = pty.spawn(cmd, args, options);

    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(evt) {
      process.on(evt, function() {
        proc.kill('SIGTERM');
      });
    });

    proc.on('close', () => {
      process.send({ event: 'pty.close' });
    });

    proc.on('data', (data) => {
      process.send({ event: 'pty.data', data });
    });
  }

  function ptyResize(columns, lines) {
    if (proc) {
      proc.resize(columns, lines);
    }
  }

  function ptyInput(data) {
    if (proc) {
      proc.write(data);
    }
  }

  function ptyQuit() {
    if (proc) {
      proc.destroy();
      proc.kill();
      proc = null;
    }
  }

  process.on('message', function(msg) {
    switch (msg.event) {
      case 'pty.start': {
        ptyStart(msg.data.cmd, msg.data.args, msg.data.options);
        break;
      }
      case 'pty.resize': {
        ptyResize(msg.data.columns, msg.data.lines);
        break;
      }
      case 'pty.input': {
        ptyInput(msg.data);
        break;
      }
      case 'pty.quit': {
        ptyQuit();
        process.exit(0);
        break;
      }
    }
  });
}());
