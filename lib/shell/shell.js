(function() {
  'use strict';

  let _term,
      _cols = 80,
      _lines = 25;

  window.termStart = function() {
    _term = new window.Terminal(80, 25);
    _term.open(document.body);

    _term.handler = (d) => {
      if (window.onTermInput) {
        window.onTermInput(d);
      }
    };

    _term.on('resize', function(cols, lines) {
      _cols = cols;
      _lines = lines;
      if (window.onTermResize) {
        window.onTermResize(cols, lines);
      }
    });

    _term.on('title', function(title) {
      if (window.onTermTitle) {
        window.onTermTitle(title);
      }
    });

    _term.sizeToFit();
    _term.showCursor();

    let resizeTimeout;
    window.addEventListener('resize', function() {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function() {
        _term.sizeToFit();
      }, 300);
    }, false);

    window.addEventListener('beforeunload', function() {
      window.onTermInput = null;
      window.onTermResize = null;
      window.onTermTitle = null;
      _term.destroy();
    });
  };

  window.termWrite = function(d) {
    _term.write(d);
  };

  window.termSizeToFit = function() {
    _term.sizeToFit();
  };

  window.termGetSize = function() {
    return { columns: _cols, lines: _lines };
  };

  window.termSetFont = function(fontFamily, fontSize, lineHeight) {
    document.getElementById('term-font').innerHTML = `body { font-family: ${fontFamily || 'Menlo'}, Menlo, Consolas, 'DejaVu Sans Mono', monospace; } .terminal { font-size: ${fontSize || 13}px; line-height: ${lineHeight || 1.35}; }`;
    if (_term) {
      _term.sizeToFit();
    }
  };

  window.onTermInput = function(/* data */) {};
  window.onTermResize = function(/* cols, lines */) {};
  window.onTermTitle = function(/* title */) {};
}());
