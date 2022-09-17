/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

const { GLib, St, Clutter, Gio } = imports.gi;
const { main, panelMenu } = imports.ui;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

class Extension {
  /*
  schema: null,
  settings: null,
  store: {},

  panelButton: null,
  label: null,
  */

  constructor(id) {
    this.id = id;
  }

  log(...args) {
    // eslint-disable-next-line gjs/no-spread
    let str = args
      .map((arg) => {
        if (typeof arg === 'object') {
          return `\n${JSON.stringify(arg, null, 2)}`;
        }

        return arg;
      })
      .join(', ');

    log(`${Me.metadata.name}: ${str}`);
  }

  enable() {
    this.state = [];

    // Get schema
    this.schema = Gio.SettingsSchemaSource.new_from_directory(
      Me.dir.get_child('schemas').get_path(),
      Gio.SettingsSchemaSource.get_default(),
      false
    );

    // Get settings
    this.settings = new Gio.Settings({
      settings_schema: this.schema.lookup(this.id, true)
    });

    this.loadSettings();

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
  }

  disable() {
    this.panelButton.destroy();
    this.saveSettings();
  }

  loadSettings() {
    let settings = this.settings.get_value('store');
    if (!settings || settings instanceof GLib.Variant === false) {
      return null;
    }

    let unpacked = settings.deep_unpack();

    this.log('loadSettings', 'store', unpacked);

    this.store = JSON.parse(unpacked);
  }

  saveSettings() {
    this.log('saveSettings', this.store);
    const settings = new GLib.Variant('s', JSON.stringify(this.store));
    this.settings.set_value('store', settings);
  }

  setState(key, value) {
    this.log('setState', key, value);
    this.store.state = this.store.state || {};
    this.store.state[key] = value;
    this.saveSettings();
  }

  getState(key) {
    this.log('getState', key, this.store.state && this.store.state[key]);
    return this.store.state ? this.store.state[key] : null;
  }

  setConfig(key, value) {
    this.log('setConfig', key, value);
    this.store.config = this.store.config || {};
    this.store.config[key] = value;
    this.saveSettings();
  }

  getConfig(key) {
    this.log('getConfig', key, this.store.config && this.store.config[key]);
    return this.store.config ? this.store.config[key] : null;
  }
}

export default Extension;
