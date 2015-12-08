'use strict';

const immutable = require('immutable'),
      Record = immutable.Record;

module.exports = class User extends Record({
  id: null,
  username: null,
  email: null,
  name: null
}) {
  static deserialize(p) {
    return new this({
      id: p.id,
      username: p.username,
      email: p.email,
      name: p.name
    });
  }
};
