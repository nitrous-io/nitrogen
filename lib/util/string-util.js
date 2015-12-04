// using common-js module syntax and limited ES6 as this module is used by
// nsync-runner as well and it isn't babel-compiled.

module.exports = {
  capitalize(str) {
    if (str.length > 0) {
      return str[0].toUpperCase() + str.slice(1);
    }
    return '';
  },

  atoi(val) {
    const p = parseInt(val);
    if (isNaN(p)) {
      return null;
    }
    return p;
  },

  parseBool(val) {
    if (typeof val === 'boolean') {
      return val;
    } else if (typeof val === 'number' && val === 1) {
      return true;
    } else if (typeof val === 'string' && ['1', 't', 'true'].includes(val.toLowerCase())) {
      return true;
    }
    return false;
  }
};
