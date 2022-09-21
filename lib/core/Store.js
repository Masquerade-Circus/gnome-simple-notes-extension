/* eslint-disable gjs/no-spread */
/* eslint-disable gjs/no-js-class */
const { GLib, Gio } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Store {
  constructor() {
    this.store = {
      state: {},
      config: {}
    };
    this.id = null;
    this.logLevel = LOG_LEVELS.ERROR;
  }

  log(...args) {
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

  logDebug(...args) {
    if (this.logLevel <= LOG_LEVELS.DEBUG) {
      this.log(...args);
    }
  }

  logInfo(...args) {
    if (this.logLevel <= LOG_LEVELS.INFO) {
      this.log(...args);
    }
  }

  logWarn(...args) {
    if (this.logLevel <= LOG_LEVELS.WARN) {
      this.log(...args);
    }
  }

  logError(...args) {
    if (this.logLevel <= LOG_LEVELS.ERROR) {
      this.log(...args);
    }
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

    this.logDebug('loadSettings', 'store', unpacked);

    this.store = JSON.parse(unpacked);
  }

  saveSettings() {
    this.logDebug('saveSettings', this.store);
    const settings = new GLib.Variant('s', JSON.stringify(this.store));
    this.settings.set_value('store', settings);
  }

  setState(key, value) {
    this.logDebug('setState', key, value);
    this.store.state = this.store.state || {};
    this.store.state[key] = value;
    this.saveSettings();
  }

  getState(key) {
    this.logDebug('getState', key, this.store.state && this.store.state[key]);
    return this.store.state ? this.store.state[key] : null;
  }

  setConfig(key, value) {
    this.logDebug('setConfig', key, value);
    this.store.config = this.store.config || {};
    this.store.config[key] = value;
    this.saveSettings();
  }

  getConfig(key) {
    this.logDebug(
      'getConfig',
      key,
      this.store.config && this.store.config[key]
    );
    return this.store.config ? this.store.config[key] : null;
  }

  clearConfig() {
    this.logDebug('clearConfig');
    this.store.config = {};
    this.saveSettings();
  }

  clearState() {
    this.logDebug('clearState');
    this.store.state = {};
    this.saveSettings();
  }
}

export default new Store();
