'use strict';

const immutable = require('immutable'),
      Record = immutable.Record;

module.exports = class Host extends Record({
  id: null,
  userId: null,
  regionId: null,
  planId: null,
  orgId: null,
  slug: null,
  name: null,
  ipAddress: null,
  hostname: null,
  proxyHostname: null,
  state: 'stopped'
}) {
  static deserialize(p) {
    return new this({
      id: p.id,
      userId: p.user_id,
      regionId: p.region_id,
      planId: p.plan_id,
      orgId: p.org_id,
      slug: p.slug,
      name: p.name,
      ipAddress: p.ip_address,
      hostname: p.hostname,
      proxyHostname: p.proxy_hostname,
      state: p.state
    });
  }

  get displayName() {
    return this.name || this.slug;
  }
};
