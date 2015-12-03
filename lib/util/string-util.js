// using common-js module syntax and limited ES6 as this module is used by
// nsync-runner as well and it isn't babel-compiled.

module.exports = {
  capitalize(str) {
    if (str.length > 0) {
      return str[0].toUpperCase() + str.slice(1);
    }
    return '';
  },

  atoi(str) {
    const p = parseInt(str);
    if (isNaN(p)) {
      return null;
    }
    return p;
  }
};
