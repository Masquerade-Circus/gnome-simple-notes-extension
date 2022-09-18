/* eslint-disable gjs/no-js-class */
const { GLib, Gio } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

class Store {
  constructor() {
    this.store = {
      state: {},
      config: {}
    };
    this.id = null;
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

  enable(id) {
    this.id = id;

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
  }

  disable() {
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

export default new Store();
