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
        if (window.onTermPrevTab) {
          window.onTermPrevTab();
        }
        return false;
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 9:  // ctrl+tab (pc & mac)
      case  evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 34: // ctrl+pagedown (pc & mac)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 221 && isMac: // cmd+shift+] (mac)
      case !evt.ctrlKey &&  evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 39  && isMac: // cmd+option+right arrow (mac)
        if (window.onTermNextTab) {
          window.onTermNextTab();
        }
        return false;
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 87 && !isMac: // ctrl+alt+shift+w (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 87 &&  isMac: // cmd+shift+w (mac)
        if (window.onTermCloseWindow) {
          window.onTermCloseWindow();
        }
        return false;
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey &&  evt.shiftKey && evt.keyCode === 78 && !isMac: // ctrl+alt+shift+n (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey &&  evt.shiftKey && evt.keyCode === 78 &&  isMac: // cmd+shift+n (mac)
        if (window.onTermNewWindow) {
          window.onTermNewWindow();
        }
        return false;
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 87 && !isMac: // ctrl+alt+w (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 87 &&  isMac: // cmd+w (mac)
        if (window.onTermCloseTab) {
          window.onTermCloseTab();
        }
        return false;
      /* disabled for now
      case  evt.ctrlKey &&  evt.altKey && !evt.metaKey && !evt.shiftKey && evt.keyCode === 78 && !isMac: // ctrl+alt+n (pc)
      case !evt.ctrlKey && !evt.altKey &&  evt.metaKey && !evt.shiftKey && evt.keyCode === 78 &&  isMac: // cmd+n (mac)
        if (window.onTermNewTab) {
          window.onTermNewTab();
        }
        return false;
      */
    }
  }

  function handleCopy() {
    if (window.onTermCopy) {
      const str = window.getSelection().toString();
      if (str) {
        // strip trailing whitespaces and copy
        window.onTermCopy(str.replace(/\s+$/gm, ''));
      }
    }
  }

  function handlePaste() {
    if (window.onTermPaste && window.onTermInput) {
      const str = window.onTermPaste();
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
      resizeTimeout = window.setTimeout(function() {
        _term.sizeToFit();
      }, 300);
    }, false);

    window.addEventListener('beforeunload', function() {
      window.onTermInput = null;
      window.onTermResize = null;
      window.onTermTitle = null;
      window.onTermPrevTab = null;
      window.onTermNextTab = null;
      window.onTermCloseTab = null;
      window.onTermCloseWindow = null;
      /* disabled for now
      window.onTermNewTab = null;
      */
      window.onTermNewWindow = null;
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
  window.onTermPrevTab = function() {};
  window.onTermNextTab = function() {};
  window.onTermCloseTab = function() {};
  window.onTermCloseWindow = function() {};
  /* disabled for now
  window.onTermNewTab = function() {};
  */
  window.onTermNewWindow = function() {};
  window.onTermCopy = function(/* string */) {};
  window.onTermPaste = function() {}; // return string to paste
}());
