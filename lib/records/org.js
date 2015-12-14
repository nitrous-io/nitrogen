/** @babel */

import { Record } from 'immutable';

export default class Org extends Record({
  id: null,
  slug: null,
  email: null,
  name: null,
  maxHosts: null,
  role: null,
  multiHost: false,
  usedHosts: null,
  createdAt: null,
  updatedAt: null
}) {
  static deserialize(o) {
    return new this({
      id: o.id,
      slug: o.slug,
      email: o.email,
      name: o.name,
      maxHosts: o.max_hosts,
      usedHosts: o.used_hosts,
      role: o.role,
      multiHost: o.multi_host,
      createdAt: o.created_at ? new Date(o.created_at) : null,
      updatedAt: o.updated_at ? new Date(o.updated_at) : null
    });
  }

  get displayName() {
    return this.name || this.slug;
  }
}
