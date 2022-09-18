/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

import Extension from '../logic/Extension';

const { main, popupMenu } = imports.ui;

class Dev extends Extension {
  constructor(id) {
    // eslint-disable-next-line gjs/no-spread
    super(id);
    this.unsafeMenuItem = null;
  }

  enable() {
    global.context.unsafe_mode = true;
    // create switch menu item which toggles unsafe mode
    this.unsafeMenuItem = new popupMenu.PopupSwitchMenuItem(
      'Unsafe Mode',
      global.context.unsafe_mode
    );
    this.unsafeMenuItem.connect('toggled', () => {
      global.context.unsafe_mode = this.unsafeMenuItem.state;
    });

    // insert it after nightLight in status bar menu
    let insertAfter = main.panel.statusArea.aggregateMenu._nightLight.menu;
    let pos = main.panel.statusArea.aggregateMenu.menu
      ._getMenuItems()
      .findIndex((menu) => menu === insertAfter);
    main.panel.statusArea.aggregateMenu.menu.addMenuItem(
      this.unsafeMenuItem,
      pos + 1
    );

    // listen for external changes to unsafe mode
    global.context.connect('notify::unsafe-mode', () => {
      if (this.unsafeMenuItem != null) {
        this.unsafeMenuItem.setToggleState(global.context.unsafe_mode);
      }
    });

    super.enable();
  }

  disable() {
    global.context.unsafe_mode = false;
    this.unsafeMenuItem.destroy();
    this.unsafeMenuItem = null;
    super.disable();
  }
}

export default Dev;
