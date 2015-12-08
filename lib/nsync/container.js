'use strict';

const immutable = require('immutable'),
      Record = immutable.Record,
      stringUtil = require('../util/string-util');

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

  get displayName() {
    return this.name || this.slug;
  }

  get stateColor() {
    switch (this.state) {
      case 'running':
        return 'green';
      case 'stopped':
        return 'red';
      case 'terminated':
        return 'gray';
      default:
        return 'yellow';
    }
  }

  get displayState() {
    switch (this.state) {
      case 'running':
      case 'stopped':
      case 'terminated':
        return stringUtil.capitalize(this.state);
      default:
        if (this.state && this.state.endsWith('ing')) {
          return this.state + '...';
        }
        return this.state;
    }
  }
};
