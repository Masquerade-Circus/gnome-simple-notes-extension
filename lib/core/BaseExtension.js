/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

import Store from './Store';

const { St, Clutter } = imports.gi;
const { main, panelMenu } = imports.ui;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

class Extension {
  /*
  panelButton: null,
  label: null,
  */

  constructor(id) {
    this.id = id;
    this.panelButton = null;
    this.label = null;
  }

  enable() {
    // Create panel button
    const panelButton = new panelMenu.Button(1, Me.metadata.name);
    panelButton.set_x_expand(true);
    panelButton.set_can_focus(true);
    panelButton.set_reactive(true);

    let label = new St.Label({
      text: '...',
      opacity: 150,
      y_align: Clutter.ActorAlign.CENTER
    });
    panelButton.add_child(label);
    panelButton.label = label;

    panelButton.updateLabel = (value) =>
      panelButton.label.set_text(value || '...');
    panelButton.setLabels = ({ on, off }) => {
      panelButton.onLabel = on;
      panelButton.offLabel = off;
    };
    panelButton.setToggleState = (value) =>
      panelButton.updateLabel(
        value ? panelButton.onLabel : panelButton.offLabel
      );

    panelButton.setLabels({ on: 'ON', off: 'OFF' });
    panelButton.updateLabel();

    this.panelButton = panelButton;

    main.panel.addToStatusArea(
      `${Me.metadata.name} Indicator`,
      this.panelButton,
      1,
      'center'
    );

    Store.enable(this.id);
  }

  disable() {
    this.panelButton.destroy();
    Store.disable();
  }
}

export default Extension;
