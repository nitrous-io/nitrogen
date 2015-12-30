(function() {
  'use strict';

  const isMac = window.navigator.userAgent.includes('Macintosh');

  let _term,
      _cols = 80,
      _lines = 25;

  function handleKeyDown(evt) {
    switch (true) {
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 67 && !isMac: // ctrl+shift+c (pc)
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 45 && !isMac: // ctrl+insert (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 67 &&  isMac: // cmd+c (mac)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 67 &&  isMac: // cmd+shift+c (mac)
        handleCopy();
        return false;
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 86 && !isMac: // ctrl+shift+v (pc)
      case !evt.ctrlKey && !evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 45 && !isMac: // shift+insert (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 86 &&  isMac: // cmd+v (mac)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 86 &&  isMac: // cmd+shift+v (mac)
        handlePaste();
        return false;
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 9:  // ctrl+shift+tab (pc & mac)
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 33: // ctrl+pageup (pc & mac)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 219 && isMac: // cmd+shift+[ (mac)
      case !evt.ctrlKey &&  evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 37  && isMac: // cmd+option+left arrow (mac)
        if (window.onKeyPrevTab) {
          window.onKeyPrevTab();
        }
        return false;
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 9:  // ctrl+tab (pc & mac)
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 34: // ctrl+pagedown (pc & mac)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 221 && isMac: // cmd+shift+] (mac)
      case !evt.ctrlKey &&  evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 39  && isMac: // cmd+option+right arrow (mac)
        if (window.onKeyNextTab) {
          window.onKeyNextTab();
        }
        return false;
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 87 && !isMac: // ctrl+alt+shift+w (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 87 &&  isMac: // cmd+shift+w (mac)
        if (window.onKeyCloseWindow) {
          window.onKeyCloseWindow();
        }
        return false;
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 78 && !isMac: // ctrl+alt+shift+n (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 78 &&  isMac: // cmd+shift+n (mac)
        if (window.onKeyNewWindow) {
          window.onKeyNewWindow();
        }
        return false;
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 87 && !isMac: // ctrl+alt+w (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 87 &&  isMac: // cmd+w (mac)
        if (window.onKeyCloseTab) {
          window.onKeyCloseTab();
        }
        return false;
      /* disabled for now
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 78 && !isMac: // ctrl+alt+n (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 78 &&  isMac: // cmd+n (mac)
        if (window.onKeyNewTab) {
          window.onKeyNewTab();
        }
        return false;
      */
    }
  }

  function handleCopy() {
    if (window.onCopy) {
      const str = window.getSelection().toString();
      if (str) {
        // strip trailing whitespaces and copy
        window.onCopy(str.replace(/\s+$/gm, ''));
      }
    }
  }

  function handlePaste() {
    if (window.onPaste && window.onTermInput) {
      const str = window.onPaste();
      if (str) {
        // convert CRLF to LF
        window.onTermInput(str.replace(/\r\n/g, '\n'));
      }
    }
  }

  window.termStart = function() {
    _term = new window.Terminal(80, 25);
    _term.open(document.body);
    _term.write('\x1b[20h');

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

    _term.originalKeyDown = _term.keyDown;

    _term.keyDown = (evt) => {
      if (handleKeyDown(evt) === false) {
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      return _term.originalKeyDown(evt);
    };

    _term.sizeToFit();
    _term.showCursor();

    let resizeTimeout;
    window.addEventListener('resize', function() {
      window.clearTimeout(resizeTimeout);
      if (window.onWindowResize) {
        window.onWindowResize();
      }
      resizeTimeout = window.setTimeout(function() {
        _term.sizeToFit();
      }, 300);
    }, false);

    window.addEventListener('beforeunload', function() {
      window.onTermInput = null;
      window.onTermResize = null;
      window.onTermTitle = null;
      window.onKeyPrevTab = null;
      window.onKeyNextTab = null;
      window.onKeyCloseTab = null;
      window.onKeyCloseWindow = null;
      /* disabled for now
      window.onKeyNewTab = null;
      */
      window.onKeyNewWindow = null;
      window.onCopy = null;
      window.onPaste = null;
      window.onWindowResize = null;
      _term.destroy();
    });

    window.addEventListener('focus', function() {
      window.Terminal.focus = _term;
      _term.redrawCursor();
    });

    window.addEventListener('blur', function() {
      window.Terminal.focus = null;
      _term.redrawCursor();
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
  window.onKeyPrevTab = function() {};
  window.onKeyNextTab = function() {};
  window.onKeyCloseTab = function() {};
  window.onKeyCloseWindow = function() {};
  /* disabled for now
  window.onKeyNewTab = function() {};
  */
  window.onKeyNewWindow = function() {};
  window.onCopy = function(/* string */) {};
  window.onPaste = function() {}; // return string to paste
  window.onWindowResize = function() {};
}());
