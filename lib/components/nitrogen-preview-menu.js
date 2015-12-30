/** @babel */

import React, { PropTypes } from 'react';
import Setting from '../records/setting';
import NitrogenDropdown from './nitrogen-dropdown';
import NitrogenDropdownMenuItem from './nitrogen-dropdown-menu-item';
import shell from 'shell';

export default class NitrogenPreviewMenu extends React.Component {
  displayName = 'NitrogenPreviewMenu';

  static propTypes = {
    setting: PropTypes.instanceOf(Setting)
  };

  handleClickMenuItem = (port) => {
    shell.openExternal(`http://localhost:${port}/`);
  };

  render() {
    const { setting } = this.props,
          { tunnelingEnabled, tunneledPorts } = setting,
          ports = [];

    if (tunnelingEnabled) {
      tunneledPorts.forEach(function(port) {
        let m;
        if (port.match(/^\d+$/)) {
          ports.push({
            name: `Port ${port}`,
            port: window.parseInt(port, 10)
          });
        } else if ((m = port.match(/^(\d+)-(\d+)$/))) {
          const from = window.parseInt(m[1], 10),
                to = window.parseInt(m[2], 10);
          let i;
          for (i = from; i <= to; i++) {
            ports.push({
              name: `Port ${i}`,
              port: i
            });
          }
        } else if ((m = port.match(/^(\d+):(\d+)$/))) {
          const local = window.parseInt(m[1], 10),
                remote = window.parseInt(m[2], 10);
          ports.push({
            name: `Port ${local} (→ ${remote})`,
            port: local
          });
        }
      });

      ports.sort(function(a, b) {
        return a.port - b.port;
      });
    }

    return (
      <div className='nitrogen-preview-menu-component'>
        <NitrogenDropdown toggleButton={
          <button className='btn btn-default icon icon-eye'>Preview</button>
        }>
          {tunnelingEnabled ? (
            ports.length > 0 ? (
              ports.map((p) => {
                return (
                  <NitrogenDropdownMenuItem onSelect={() => {
                    this.handleClickMenuItem(p.port);
                  }}>
                    {p.name}
                  </NitrogenDropdownMenuItem>
                );
              })
            ) : (
              <NitrogenDropdownMenuItem disabled>
                <em>Port forwarding not configured</em>
              </NitrogenDropdownMenuItem>
            )
          ) : (
            <NitrogenDropdownMenuItem disabled>
              <em>Port forwarding not enabled</em>
            </NitrogenDropdownMenuItem>
          )}
        </NitrogenDropdown>
      </div>
    );
  }
}
