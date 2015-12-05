'use strict';

const immutable = require('immutable');

const Record = immutable.Record;

module.exports = class Container extends Record({
  id: null,
  userId: null,
  hostId: null,
  image: null,
  slug: null,
  name: null,
  state: null,
  previewHostname: null,
  sshUrl: null,
  // shared containers
  userUsername: null,
  userName: null,
  userGravatarHash: null
}) {
  static deserialize(p) {
    return new this({
      id: p.id,
      userId: p.user_id,
      hostId: p.host_id,
      image: p.image,
      slug: p.slug,
      name: p.name,
      state: p.state,
      previewHostname: p.preview_hostname,
      sshUrl: p.ssh_url,
      // shared containers
      userUsername: p.user_username,
      userName: p.user_name,
      userGravatarHash: p.user_gravatar_hash
    });
  }
};
