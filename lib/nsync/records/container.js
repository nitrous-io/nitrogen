'use strict';

const immutable = require('immutable'),
      Record = immutable.Record;

module.exports = class Container extends Record({
  id: null,
  slug: null,
  state: null,
  hostId: null
}) {
  static deserialize(p) {
    return new this({
      id: p.id,
      slug: p.slug,
      state: p.state,
      hostId: p.host_id
    });
  }
};
