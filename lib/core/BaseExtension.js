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
  }

  enable() {
    Store.enable(this.id);
  }

  disable() {
    Store.disable();
  }

  addPanelButton({ role, alignment, name, dontCreateMenu }) {
    // Create panel button
    const panelButton = new panelMenu.Button(
      typeof alignment === 'undefined' ? 0.5 : alignment,
      name ? name : Me.metadata.name,
      typeof dontCreateMenu === 'undefined' ? true : dontCreateMenu
    );
    panelButton.set_x_expand(true);
    panelButton.set_can_focus(true);
    panelButton.set_reactive(true);
    panelButton.state = 0;
    panelButton.states = [
      {
        state: 0,
        label: '...'
      }
    ];

    let label = new St.Label({
      text: '...',
      opacity: 150,
      y_align: Clutter.ActorAlign.CENTER
    });
    panelButton.add_child(label);
    panelButton.label = label;

    panelButton.setLabel = (value) =>
      panelButton.label.set_text(value || '...');

    panelButton.setStates = (states) => {
      if (!Array.isArray(states)) {
        throw new Error('States must be an array');
      }

      for (let obj of states) {
        if (
          typeof obj !== 'object' ||
          obj === null ||
          'state' in obj === false ||
          'label' in obj === false
        ) {
          throw new Error(
            'State item must be an object with state and label properties'
          );
        }
      }

      panelButton.states = states;
    };

    panelButton.setState = (state) => {
      let stateObj = panelButton.states.find((s) => s.state === state);
      if (!stateObj) {
        throw new Error(`State ${state} not found`);
      }
      panelButton.state = state;
      panelButton.setLabel(stateObj.label);
    };

    panelButton.nextState = () => {
      let stateIndex = panelButton.states.findIndex(
        (s) => s.state === panelButton.state
      );

      if (stateIndex === -1) {
        throw new Error(`Current state ${panelButton.state} not found`);
      }

      let nextStateIndex = stateIndex + 1;
      if (nextStateIndex >= panelButton.states.length) {
        nextStateIndex = 0;
      }

      panelButton.setState(panelButton.states[nextStateIndex].state);
    };

    main.panel.addToStatusArea(
      `${Me.metadata.name} ${role || 'Indicator'}`,
      panelButton,
      1,
      'center'
    );

    return panelButton;
  }
}

export default Extension;
