// this file needs to use common-js module syntax and limited ES6 because it
// is injected into nsync-runner browser window and isn't babel-compiled.

module.exports = function(nsyncRunnerPath, nodeModulesPath) {
  'use strict';

  const isMac = process.platform === 'darwin',
        isWindows = process.platform === 'win32',
        isLinux = process.platform === 'linux';

  window.addEventListener('error', function() {
    require('remote').getCurrentWindow().show();
  }, false);

  window.addEventListener('keydown', function(e) {
    if (e.keyCode === 73 && e.altKey && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
      require('remote').getCurrentWindow().inspectElement(0, 0);
    }
  }, false);

  // set up require to look at correct paths
  require.main.filename = nsyncRunnerPath;
  require.main.paths.push(nodeModulesPath);

  require('babel/polyfill');

  const path = require('path'),
        lockfile = require('lockfile'),
        $ = require('jquery'),
        iwc = require('../util/iwc'),
        remote = require('remote'),
        app = remote.require('app'),
        mainProcess = remote.getGlobal('process'),
        currentWindow = remote.getCurrentWindow();

  const processStartDate = new Date(+new Date() - mainProcess.uptime() * 1000).toISOString().slice(0, 10),
        lockFileName = `nitrogen-${processStartDate}-${mainProcess.pid}.lock`,
        lockPath = path.join(app.getPath('temp'), lockFileName);

  lockfile.lock(lockPath, (err) => {
    if (err) {
      currentWindow.close();
      return;
    }
    main();
  });

  function main() {
    currentWindow.show();

    iwc.setEnv('NSYNC_RUNNER_READY', true);
    iwc.send('nsync-runner.ready');

    const nsync = new Nsync();

    iwc.on('nsync-runner.start-server', function(nitrousHost, authToken, folderPath) {
      nsync.run(nitrousHost, authToken, folderPath);
    });
  }

  function Nsync() {
    this.running = false;
    this.proc = null;
    this.port = null;
    this.nitrousHost = null;
    this.authToken = null;
    this.folderPath = null;
  }

  Object.assign(Nsync.prototype, {
    run(nitrousHost, authToken, folderPath) {
      if (this.running || !authToken || !folderPath) {
        return false;
      }
      this.running = true;
      this.nitrousHost = nitrousHost;
      this.authToken = authToken;
      this.folderPath = folderPath;

      const childProcess = require('child_process');
      let nsyncCmd = path.join(path.dirname(nsyncRunnerPath), '..', '..', 'nsync');

      if (isMac) {
        nsyncCmd = path.join(nsyncCmd, 'osx64', 'nsync');
      } else if (isWindows) {
        nsyncCmd = path.join(nsyncCmd, 'win32', 'nsync.exe');
      } else if (isLinux) {
        nsyncCmd = path.join(nsyncCmd, 'lin64', 'nsync');
      } else {
        return panic(new Error("unsupported platform"));
      }

      log('\nRunning Nsync...\n');

      const proc = this.proc = childProcess.spawn(nsyncCmd, [], {
        cwd: path.dirname(nsyncCmd),
        env: iwc.getEnv(),
        detached: false
      });

      ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(evt) {
        process.on(evt, function() {
          proc.kill('SIGTERM');
        });
      });

      proc.on('close', (code) => {
        log(`\nProcess exited with code ${code}`);
        this.proc = null;
      });

      proc.stdout.on('data', this.handleOutput.bind(this));
      proc.stderr.on('data', this.handleOutput.bind(this));

      return true;
    },

    handleOutput(data) {
      const atoi = require('../util/string-util').atoi;

      data = new Buffer(data).toString('utf8');
      log(data);

      const match = data.match(/Nsync ready at port (\d+)/m);
      if (match) {
        const port = atoi(match[1]);
        if (port) {
          this.port = port;
          this.makeInitRequest();
        } else {
          return panic(new Error('malformed port detected'));
        }
      }
    },

    makeInitRequest() {
      const port = this.port;

      $.ajax({
        type: 'POST',
        url: `http://127.0.0.1:${port}/init`,
        dataType: 'json',
        data: {
          host: this.nitrousHost,
          token: this.authToken,
          path: this.folderPath
        }
      }).then(() => {
        iwc.setEnv('NSYNC_PORT', port);
        iwc.send('nsync-runner.server-running', port);
      });
    }
  });

  const textarea = document.querySelector('textarea');

  function log(msg) {
    textarea.appendChild(document.createTextNode(msg));
  }

  function panic(err) {
    log('\n' + err.toString());
    throw err;
  }
};
