"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// lib/logic/constants.js
var NOTE_TYPES = {
  TEXT: "text",
  TASKS: "tasks",
  IMAGE: "image",
  WORKSPACE: "workspace"
};
var NOTE_MODAL = {
  maxWidth: 640,
  maxHeight: Math.trunc(640 / 16 * 9)
};
var COLOR_TYPES = {
  PRIMARY: "primary",
  ACCENT: "accent",
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  DANGER: "danger",
  DEFAULT: "default"
};
var COLORS = {
  primary: "#3244ad",
  accent: "#953ca5",
  success: "#2ab7a9",
  info: "#00c3e0",
  warning: "#bf7921",
  danger: "#bb2626",
  default: "#646c8a"
};
var DEFAULT_NOTES = [
  {
    title: "Note 1",
    type: "text",
    content: "This is a text note",
    color: "primary"
  },
  {
    title: "Note 2",
    type: "tasks",
    content: [
      {
        title: "Task 1",
        isDone: true
      },
      {
        title: "Task 2",
        isDone: false
      },
      {
        title: "Task 3",
        isDone: true
      },
      {
        title: "Task 4",
        isDone: false
      },
      {
        title: "Task 5",
        isDone: false
      }
    ],
    color: "default"
  },
  {
    title: "Note 3",
    type: "image",
    content: "https://picsum.photos/320/180",
    color: "success"
  }
];
var POSITION_TYPES = {
  TOP: "top",
  LEFT: "left",
  RIGHT: "right"
};
var SIZES = {
  SMALLEST: {
    width: 160,
    height: Math.trunc(160 / 16 * 9),
    label: "Smallest"
  },
  SMALL: {
    width: 240,
    height: Math.trunc(240 / 16 * 9),
    label: "Small"
  },
  MEDIUM: {
    width: 320,
    height: Math.trunc(320 / 16 * 9),
    icon: "view-medium-symbolic",
    label: "Medium"
  },
  LARGE: {
    width: 400,
    height: Math.trunc(400 / 16 * 9),
    label: "Large"
  },
  FULL: {
    width: 640,
    height: Math.trunc(640 / 16 * 9),
    label: "Full"
  }
};
var DEFAULT_NOTES_CONFIG = {
  width: SIZES.SMALL.width,
  height: SIZES.SMALL.height,
  position: POSITION_TYPES.LEFT
};

// lib/core/Store.js
var { GLib, Gio } = imports.gi;
var ExtensionUtils = imports.misc.extensionUtils;
var Me = ExtensionUtils.getCurrentExtension();
var LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};
var Store = class {
  constructor() {
    this.store = {
      state: {},
      config: {}
    };
    this.id = null;
    this.logLevel = LOG_LEVELS.ERROR;
  }
  log(...args) {
    let str = args.map((arg) => {
      if (typeof arg === "object") {
        return `
${JSON.stringify(arg, null, 2)}`;
      }
      return arg;
    }).join(", ");
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
  enable(id2) {
    this.id = id2;
    this.schema = Gio.SettingsSchemaSource.new_from_directory(
      Me.dir.get_child("schemas").get_path(),
      Gio.SettingsSchemaSource.get_default(),
      false
    );
    this.settings = new Gio.Settings({
      settings_schema: this.schema.lookup(this.id, true)
    });
    this.loadSettings();
  }
  disable() {
    this.saveSettings();
  }
  loadSettings() {
    let settings = this.settings.get_value("store");
    if (!settings || settings instanceof GLib.Variant === false) {
      return null;
    }
    let unpacked = settings.deep_unpack();
    this.logDebug("loadSettings", "store", unpacked);
    this.store = JSON.parse(unpacked);
  }
  saveSettings() {
    this.logDebug("saveSettings", this.store);
    const settings = new GLib.Variant("s", JSON.stringify(this.store));
    this.settings.set_value("store", settings);
  }
  setState(key, value) {
    this.logDebug("setState", key, value);
    this.store.state = this.store.state || {};
    this.store.state[key] = value;
    this.saveSettings();
  }
  getState(key) {
    this.logDebug("getState", key, this.store.state && this.store.state[key]);
    return this.store.state ? this.store.state[key] : null;
  }
  setConfig(key, value) {
    this.logDebug("setConfig", key, value);
    this.store.config = this.store.config || {};
    this.store.config[key] = value;
    this.saveSettings();
  }
  getConfig(key) {
    this.logDebug(
      "getConfig",
      key,
      this.store.config && this.store.config[key]
    );
    return this.store.config ? this.store.config[key] : null;
  }
  clearConfig() {
    this.logDebug("clearConfig");
    this.store.config = {};
    this.saveSettings();
  }
  clearState() {
    this.logDebug("clearState");
    this.store.state = {};
    this.saveSettings();
  }
};
var Store_default = new Store();

// lib/core/BaseExtension.js
var { St, Clutter } = imports.gi;
var { main, panelMenu } = imports.ui;
var ExtensionUtils2 = imports.misc.extensionUtils;
var Me2 = ExtensionUtils2.getCurrentExtension();
var Extension = class {
  constructor(id2) {
    this.id = id2;
  }
  enable() {
    Store_default.enable(this.id);
  }
  disable() {
    Store_default.disable();
  }
  addPanelButton({ role, alignment, name, dontCreateMenu }) {
    const panelButton = new panelMenu.Button(
      typeof alignment === "undefined" ? 0.5 : alignment,
      name ? name : Me2.metadata.name,
      typeof dontCreateMenu === "undefined" ? true : dontCreateMenu
    );
    panelButton.set_x_expand(true);
    panelButton.set_can_focus(true);
    panelButton.set_reactive(true);
    panelButton.state = 0;
    panelButton.states = [
      {
        state: 0,
        label: "..."
      }
    ];
    let label = new St.Label({
      text: "...",
      opacity: 150,
      y_align: Clutter.ActorAlign.CENTER
    });
    panelButton.add_child(label);
    panelButton.label = label;
    panelButton.setLabel = (value) => panelButton.label.set_text(value || "...");
    panelButton.setStates = (states) => {
      if (!Array.isArray(states)) {
        throw new Error("States must be an array");
      }
      for (let obj of states) {
        if (typeof obj !== "object" || obj === null || "state" in obj === false || "label" in obj === false) {
          throw new Error(
            "State item must be an object with state and label properties"
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
      `${Me2.metadata.name} ${role || "Indicator"}`,
      panelButton,
      1,
      "center"
    );
    return panelButton;
  }
};
var BaseExtension_default = Extension;

// lib/logic/modals/NoteModal.js
var { St: St2, Clutter: Clutter2 } = imports.gi;
var { modalDialog: ModalDialog } = imports.ui;
var NoteModal = class {
  constructor({ id: id2, onUpdate, isNew, buttons }) {
    const notes = Store_default.getState("notes") || [];
    const note = notes[id2];
    if (!note) {
      throw new Error("Note not found");
    }
    this.title = note.title;
    this.type = note.type;
    this.content = note.content;
    this.color = note.color;
    this.onUpdate = onUpdate;
    this.id = id2;
    this.isNew = isNew || false;
    this.oldContent = null;
    this.newContent = null;
    this.width = NOTE_MODAL.maxWidth;
    this.height = NOTE_MODAL.maxHeight;
    this.buttons = __spreadValues({
      save: true,
      delete: true,
      close: true
    }, buttons || {});
    this.widget = null;
    this.createWidget();
    this.update();
  }
  constructBody() {
    throw new Error("Not implemented");
  }
  createWidget() {
    const widget = new ModalDialog.ModalDialog({});
    this.bindedQueueRelayout = this.queueRelayout.bind(this);
    global.display.connect("workareas-changed", this.bindedQueueRelayout);
    widget.contentLayout.style_class = "note-content-layout";
    widget.contentLayout.style = `background-color: ${COLORS[this.color]};border-radius: 5px;`;
    widget.contentLayout.width = NOTE_MODAL.maxWidth;
    widget.contentLayout.height = NOTE_MODAL.maxHeight;
    widget.connect("destroy", () => this.destroy());
    this.widget = widget;
    this.setButtons();
  }
  queueRelayout() {
    if (this.widget) {
      this.widget.queue_relayout();
    }
  }
  setButtons() {
    const buttons = [];
    if (this.buttons.save) {
      buttons.push({
        label: "Save",
        action: () => this.save(),
        key: Clutter2.KEY_S
      });
    }
    if (this.buttons.delete) {
      buttons.push({
        label: "Delete",
        action: () => this.delete()
      });
    }
    if (this.buttons.close) {
      buttons.push({
        label: "Close",
        action: () => this.close(),
        key: Clutter2.KEY_Escape
      });
    }
    this.widget.setButtons(buttons);
  }
  setTitle() {
    const titleBox = new St2.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: "background-color: rgba(0, 0, 0, 0.2);border-radius: 5px 5px 0 0;",
      x_align: Clutter2.ActorAlign.FILL
    });
    const title = new St2.Entry({
      text: this.title,
      clip_to_allocation: true,
      reactive: true,
      style: "font-weight: bold; font-size: 14px;color: #fff; padding: 5px; background-color: transparent; outline: none;border: none;",
      x_expand: true
    });
    title.clutter_text.connect("text-changed", () => {
      this.title = title.get_text();
    });
    titleBox.connect("button-press-event", () => {
      title.grab_key_focus();
    });
    titleBox.add_child(title);
    this.widget.contentLayout.add_child(titleBox);
  }
  setColorButtons() {
    const colorButtons = new St2.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 5px;",
      x_align: Clutter2.ActorAlign.END
    });
    Object.keys(COLORS).forEach((colorName) => {
      const color = COLORS[colorName];
      let style = `background-color: ${color};border-radius: 5px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.5); margin: 0 5px;`;
      if (colorName === this.color) {
        style += "border: 2px solid #fff;";
      }
      const button = new St2.Button({
        style,
        width: 30,
        height: 30,
        x_align: Clutter2.ActorAlign.CENTER,
        y_align: Clutter2.ActorAlign.CENTER
      });
      button.connect("clicked", () => {
        this.color = colorName;
        this.widget.contentLayout.style = `background-color: ${color};border-radius: 5px;`;
        this.update();
      });
      colorButtons.add_child(button);
    });
    this.widget.contentLayout.add_child(colorButtons);
  }
  hide() {
    this.widget.close();
  }
  show() {
    this.widget.open();
  }
  save() {
    if (this.newContent) {
      this.content = this.newContent;
    }
    let notes = Store_default.getState("notes");
    notes[this.id] = {
      title: this.title,
      type: this.type,
      content: this.content,
      color: this.color
    };
    Store_default.setState("notes", notes);
    this.isNew = false;
    this.hide();
    this.widget.destroy();
    if (typeof this.onUpdate === "function") {
      setTimeout(() => this.onUpdate(), 100);
    }
  }
  delete() {
    let notes = Store_default.getState("notes");
    notes.splice(this.id, 1);
    Store_default.setState("notes", notes);
    this.hide();
    this.widget.destroy();
    if (typeof this.onUpdate === "function") {
      setTimeout(() => this.onUpdate(), 100);
    }
  }
  close() {
    this.hide();
    if (this.isNew) {
      this.delete();
    } else {
      if (this.oldContent) {
        this.content = this.oldContent;
      }
      this.widget.destroy();
    }
  }
  update() {
    if (!this.widget) {
      throw new Error("Widget not created");
    }
    this.widget.contentLayout.destroy_all_children();
    this.constructBody();
    this.show();
  }
  destroy() {
    this.widget = null;
    global.display.disconnect("workareas-changed", this.bindedQueueRelayout);
  }
};

// lib/logic/modals/ImageNoteModal.js
var { St: St3, Clutter: Clutter3 } = imports.gi;
var ImageNoteModal = class extends NoteModal {
  constructor({ id: id2, onUpdate }) {
    super({ id: id2, onUpdate });
  }
  constructBody() {
    let style = `background-size: contain;background-image: url("${this.content}");border-radius: 5px;`;
    const imageArea = new St3.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style,
      x_align: Clutter3.ActorAlign.FILL,
      y_align: Clutter3.ActorAlign.FILL,
      x_expand: true,
      y_expand: true
    });
    this.widget.contentLayout.add_child(imageArea);
    const imageInput = new St3.Entry({
      clip_to_allocation: true,
      reactive: true,
      style: "font-size: 14px;color: #fff; padding: 5px;",
      x_expand: true,
      text: this.content
    });
    this.newContent = null;
    imageInput.clutter_text.connect("text-changed", () => {
      this.newContent = imageInput.get_text();
    });
    this.widget.contentLayout.add_child(imageInput);
  }
};

// lib/logic/modals/TasksNoteModal.js
var { St: St4, Clutter: Clutter4 } = imports.gi;
var { checkBox: CheckBox } = imports.ui;
var TasksNoteModal = class extends NoteModal {
  constructor({ id: id2, onUpdate }) {
    super({ id: id2, onUpdate });
  }
  constructBody() {
    this.setTitle();
    this.createTasksBox();
    this.oldContent = this.content.map((task) => __spreadValues({}, task));
    this.content = this.content.map((task) => __spreadValues({}, task));
    this.content.forEach((task) => {
      this.tasksBox.add_child(this.getTaskBox(task));
    });
    this.tasksBox.add_child(this.getNewTaskBox());
    this.setColorButtons();
    setTimeout(() => {
      this.newTaskEntry.grab_key_focus();
    }, 100);
  }
  createTasksBox() {
    const tasksBox = new St4.BoxLayout({
      vertical: true,
      reactive: true,
      x_expand: true,
      y_expand: true,
      style: "padding: 5px;",
      x_align: Clutter4.ActorAlign.FILL,
      y_align: Clutter4.ActorAlign.FILL
    });
    const scrollView = new St4.ScrollView({
      hscrollbar_policy: St4.PolicyType.NEVER,
      vscrollbar_policy: St4.PolicyType.AUTOMATIC,
      overlay_scrollbars: true,
      reactive: true,
      x_expand: true,
      y_expand: true
    });
    scrollView.add_actor(tasksBox);
    this.widget.contentLayout.add_child(scrollView);
    this.tasksBox = tasksBox;
  }
  getTaskBox(task) {
    const taskBox = new St4.BoxLayout({
      vertical: false,
      reactive: true,
      style: "padding: 2px;"
    });
    const checkBox = new CheckBox.CheckBox("");
    checkBox.checked = task.isDone;
    checkBox.connect("clicked", () => {
      task.isDone = !task.isDone;
      this.update();
    });
    const taskEntry = new St4.Entry({
      text: task.title,
      clip_to_allocation: true,
      reactive: true,
      style: "font-size: 14px;color: #fff; padding: 2px 5px 1px;",
      x_expand: true
    });
    taskEntry.clutter_text.connect("text-changed", () => {
      task.title = taskEntry.get_text();
    });
    taskEntry.clutter_text.connect("activate", () => {
      if (task.title === "") {
        this.content = this.content.filter((t) => t !== task);
        this.update();
      }
    });
    taskBox.add_child(checkBox);
    taskBox.add_child(taskEntry);
    return taskBox;
  }
  getNewTaskBox() {
    const task = {
      title: "",
      isDone: false
    };
    const taskBox = new St4.BoxLayout({
      vertical: false,
      reactive: true,
      style: "padding: 2px;"
    });
    const taskEntry = new St4.Entry({
      text: task.title,
      clip_to_allocation: true,
      reactive: true,
      style: "font-size: 14px;color: #fff; padding: 2px 5px 1px;",
      x_expand: true
    });
    taskEntry.clutter_text.connect("text-changed", () => {
      task.title = taskEntry.get_text();
    });
    taskEntry.clutter_text.connect("activate", () => {
      if (task.title !== "") {
        this.content.push(task);
        this.update();
      }
    });
    taskBox.add_child(taskEntry);
    this.newTaskEntry = taskEntry;
    return taskBox;
  }
};

// lib/logic/modals/TextNoteModal.js
var { St: St5, Pango } = imports.gi;
var TextNoteModal = class extends NoteModal {
  constructor({ id: id2, onUpdate }) {
    super({ id: id2, onUpdate });
  }
  constructBody() {
    this.setTitle();
    const textArea = new St5.BoxLayout({
      clip_to_allocation: true,
      vertical: true,
      reactive: true,
      style: "padding: 5px;",
      x_expand: true,
      y_expand: true
    });
    this.widget.contentLayout.add_child(textArea);
    const text = new St5.Entry({
      text: this.content,
      reactive: true,
      style: "font-size: 14px;color: #fff; padding: 5px; background-color: transparent; outline: none;border: none;",
      x_expand: true,
      y_expand: false
    });
    let clutterText = text.clutter_text;
    clutterText.set_single_line_mode(false);
    clutterText.set_activatable(false);
    clutterText.set_line_wrap(true);
    clutterText.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
    clutterText.connect("text-changed", () => {
      this.content = text.get_text();
    });
    textArea.add_child(text);
    textArea.connect("button-press-event", () => {
      text.grab_key_focus();
    });
    this.setColorButtons();
  }
};

// lib/logic/modals/WorkspaceNoteModal.js
var { WorkspaceThumbnail } = imports.ui.workspaceThumbnail;
var workspaceManager = global.workspace_manager;
var WorkspaceNoteModal = class extends NoteModal {
  constructor({ id: id2, onUpdate }) {
    super({ id: id2, onUpdate, buttons: { save: false } });
  }
  constructBody() {
    const workspace = workspaceManager.get_workspace_by_index(this.content);
    const workspaceThumbnail = new WorkspaceThumbnail(workspace, 0);
    this.workspaceThumbnail = workspaceThumbnail;
    workspaceThumbnail.set_size(this.width, this.height);
    workspaceThumbnail.show();
    const scale = this.width / global.screen_width;
    workspaceThumbnail.setScale(scale, scale);
    workspaceThumbnail.style = "border-radius: 5px;background: #000000;";
    this.removeDraggableFromWindows();
    this.widget.contentLayout.add(workspaceThumbnail);
  }
  removeDraggableFromWindows() {
    if (this.workspaceThumbnail) {
      this.workspaceThumbnail._windows.forEach((child) => {
        if (child.realWindow && child._draggable) {
          child.set_reactive(false);
        }
      });
    }
  }
};

// lib/logic/notes/Note.js
var { St: St6 } = imports.gi;
var Note = class {
  constructor({ id: id2, width, height, onUpdate }) {
    const notes = Store_default.getState("notes") || [];
    const note = notes[id2];
    if (!note) {
      throw new Error("Note not found");
    }
    this.box = new St6.BoxLayout({
      vertical: true,
      width,
      height,
      clip_to_allocation: true,
      reactive: true,
      style: `background-color: ${COLORS[note.color]};border-radius: 5px;margin: 5px;`
    });
    this.box.connect("button-press-event", () => {
      switch (note.type) {
        case NOTE_TYPES.TEXT:
          new TextNoteModal({
            id: this.id,
            onUpdate: () => this.update()
          });
          break;
        case NOTE_TYPES.TASKS:
          new TasksNoteModal({
            id: this.id,
            onUpdate: () => this.update()
          });
          break;
        case NOTE_TYPES.IMAGE:
          new ImageNoteModal({
            id: this.id,
            onUpdate: () => this.update()
          });
          break;
        case NOTE_TYPES.WORKSPACE:
          new WorkspaceNoteModal({
            id: this.id,
            onUpdate: () => this.update()
          });
          break;
      }
    });
    this.id = id2;
    this.title = note.title;
    this.type = note.type;
    this.content = note.content;
    this.color = note.color;
    this.width = width;
    this.height = height;
    this.onUpdate = onUpdate;
    this.box.connect("destroy", () => this.destroy());
    this.constructBody();
  }
  destroy() {
    this.box = null;
  }
  setTitle(prefix = "") {
    if (this.titleText) {
      this.titleText.set_text(`${prefix} ${this.title}`.trim());
      return;
    }
    this.titleText = new St6.Label({
      text: `${prefix} ${this.title}`.trim(),
      clip_to_allocation: true,
      reactive: true,
      style: "font-weight: bold;font-size: 14px;color: #fff; padding: 5px; background-color: rgba(0, 0, 0, 0.2);border-radius: 5px 5px 0 0;"
    });
    this.box.add_child(this.titleText);
  }
  constructBody() {
    throw new Error("Method not implemented");
  }
  update() {
    if (typeof this.onUpdate === "function" && this.onUpdate() === false) {
      return;
    }
    this.rebuild();
  }
  rebuild() {
    if (this.box) {
      this.box.destroy_all_children();
      this.constructBody();
    }
  }
  save({ reload = true } = {}) {
    const notes = Store_default.getState("notes") || [];
    notes[this.id] = {
      title: this.title,
      type: this.type,
      content: this.content,
      color: this.color
    };
    Store_default.setState("notes", notes);
    if (reload) {
      this.update();
    }
  }
};

// lib/logic/notes/ImageNote.js
var { St: St7 } = imports.gi;
var ImageNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
  }
  constructBody() {
    const imageBox = new St7.BoxLayout({
      clip_to_allocation: true,
      reactive: true,
      can_focus: true,
      style: `background-size: cover;background-image: url("${this.content}");border-radius: 5px;`,
      x_expand: true,
      y_expand: true
    });
    this.box.add_child(imageBox);
  }
};

// lib/logic/notes/TasksNote.js
var { St: St8, Clutter: Clutter5 } = imports.gi;
var { checkBox: CheckBox2 } = imports.ui;
var TasksNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
  }
  constructBody() {
    this.updateTitle();
    const tasksBox = new St8.BoxLayout({
      vertical: true,
      reactive: true,
      style: "padding: 5px;"
    });
    const scrollView = new St8.ScrollView({
      hscrollbar_policy: St8.PolicyType.NEVER,
      vscrollbar_policy: St8.PolicyType.AUTOMATIC,
      overlay_scrollbars: true,
      reactive: true
    });
    scrollView.add_actor(tasksBox);
    this.content.forEach((task) => {
      tasksBox.add_child(this.getTaskBox(task));
    });
    if (this.content.length === 0) {
      const noTasksText = new St8.Label({
        text: "No tasks to do!",
        clip_to_allocation: true,
        reactive: true,
        style: "padding: 5px;",
        opacity: 150,
        x_align: Clutter5.ActorAlign.CENTER
      });
      tasksBox.add_child(noTasksText);
    }
    this.box.add_child(scrollView);
  }
  updateTitle() {
    let doneTasksCount = this.content.reduce(
      (acc, task) => task.isDone ? acc += 1 : acc,
      0
    );
    this.setTitle(`(${doneTasksCount}/${this.content.length})`);
  }
  getTaskBox(task) {
    const taskBox = new St8.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 2px;"
    });
    const taskCheckBox = new CheckBox2.CheckBox(task.title);
    taskCheckBox.checked = task.isDone;
    taskCheckBox.connect("clicked", () => {
      task.isDone = !task.isDone;
      this.save({ reload: false });
      this.updateTitle();
    });
    taskBox.add_child(taskCheckBox);
    return taskBox;
  }
};

// lib/logic/notes/TextNote.js
var { St: St9, Pango: Pango2, Clutter: Clutter6 } = imports.gi;
var TextNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
  }
  constructBody() {
    this.setTitle();
    const textArea = new St9.BoxLayout({
      clip_to_allocation: true,
      vertical: true,
      reactive: true,
      style: "padding: 5px;",
      x_expand: true,
      y_expand: true
    });
    const text = new St9.Entry({
      text: this.content,
      clip_to_allocation: true,
      reactive: true,
      style: "font-size: 14px;color: #fff; padding: 5px; background-color: transparent; outline: none;border: none;",
      x_expand: true
    });
    let clutterText = text.clutter_text;
    clutterText.set_single_line_mode(false);
    clutterText.set_activatable(false);
    clutterText.set_line_wrap(true);
    clutterText.set_line_wrap_mode(Pango2.WrapMode.WORD_CHAR);
    clutterText.connect("text-changed", () => {
      this.content = text.get_text();
      this.save({
        reload: false
      });
    });
    textArea.add_child(text);
    textArea.connect("button-press-event", () => {
      text.grab_key_focus();
      return Clutter6.EVENT_STOP;
    });
    this.box.add_child(textArea);
  }
};

// lib/logic/notes/WorkspaceNote.js
var { Clutter: Clutter7 } = imports.gi;
var { main: Main } = imports.ui;
var { WorkspaceThumbnail: WorkspaceThumbnail2 } = imports.ui.workspaceThumbnail;
var workspaceManager2 = global.workspace_manager;
var WorkspaceNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
    this.addListeners();
  }
  addListeners() {
    this.bindedRebuild = this.rebuild.bind(this);
    this.bindedRemoveDraggableFromWindows = this.removeDraggableFromWindows.bind(this);
    global.display.connect(
      "window-entered-monitor",
      this.bindedRemoveDraggableFromWindows
    );
    global.display.connect("workareas-changed", this.bindedRebuild);
    Main.layoutManager.connect("monitors-changed", this.bindedRebuild);
    global.display.connect("notify::focus-window", this.bindedRebuild);
  }
  constructBody() {
    const workspace = workspaceManager2.get_workspace_by_index(this.content);
    const workspaceThumbnail = new WorkspaceThumbnail2(workspace, 0);
    this.workspaceThumbnail = workspaceThumbnail;
    workspaceThumbnail.set_size(this.width, this.height);
    workspaceThumbnail.show();
    const scale = this.width / global.screen_width;
    workspaceThumbnail.setScale(scale, scale);
    workspaceThumbnail.style = "border-radius: 5px;background: #000000;";
    this.removeDraggableFromWindows();
    this.box.connect("scroll-event", (actor, event) => {
      const direction = event.get_scroll_direction();
      if (direction === Clutter7.ScrollDirection.UP) {
        this.content++;
        if (this.content >= workspaceManager2.n_workspaces) {
          this.content = 0;
        }
        this.rebuild();
      } else if (direction === Clutter7.ScrollDirection.DOWN) {
        this.content--;
        if (this.content < 0) {
          this.content = workspaceManager2.n_workspaces - 1;
        }
        this.rebuild();
      }
      return Clutter7.EVENT_STOP;
    });
    this.box.add(workspaceThumbnail);
  }
  removeDraggableFromWindows() {
    if (this.workspaceThumbnail) {
      this.workspaceThumbnail._windows.forEach((child) => {
        if (child.realWindow && child._draggable) {
          child.set_reactive(false);
        }
      });
    }
  }
  destroy() {
    global.display.disconnect(
      "window-entered-monitor",
      this.bindedRemoveDraggableFromWindows
    );
    global.display.disconnect("workareas-changed", this.bindedRebuild);
    Main.layoutManager.disconnect("monitors-changed", this.bindedRebuild);
    global.display.disconnect("notify::focus-window", this.bindedRebuild);
    super.destroy();
  }
};

// lib/logic/modals/createNewNote.js
var createNewNote = ({ type, onUpdate }) => {
  let notes = Store_default.getState("notes");
  let id2 = notes.length;
  const note = {
    title: "New note",
    type,
    content: "",
    color: COLOR_TYPES.DEFAULT
  };
  notes.push(note);
  switch (type) {
    case NOTE_TYPES.TEXT:
      new TextNoteModal({ id: id2, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.TASKS:
      note.title = "New tasks";
      note.content = [];
      new TasksNoteModal({ id: id2, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.IMAGE:
      new ImageNoteModal({ id: id2, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.WORKSPACE:
      note.title = "Workspace switcher";
      note.content = 0;
      Store_default.setState("notes", notes);
      onUpdate();
      break;
  }
};

// lib/logic/Extension.js
var { main: Main2, ctrlAltTab: CtrlAltTab, popupMenu: PopupMenu } = imports.ui;
var { St: St10, Clutter: Clutter8 } = imports.gi;
var Extension2 = class extends BaseExtension_default {
  constructor(id2) {
    super(id2);
    this.widget = null;
    this.addNoteButton = null;
    this.showNotesButton = null;
    this.notesBox = null;
    this.scrollView = null;
  }
  enable() {
    super.enable();
    this.initConfigAndState();
    this.initPanelButtons();
    this.initWidget();
    this.initNotesBox();
  }
  disable() {
    super.disable();
    if (this.widget) {
      this.widget.destroy();
    }
    if (this.showNotesButton) {
      this.showNotesButton.destroy();
    }
    if (this.addNoteButton) {
      this.addNoteButton.destroy();
    }
    if (this.configButton) {
      this.configButton.destroy();
    }
  }
  initConfigAndState() {
    let isHidden = Store_default.getConfig("isHidden");
    if (typeof isHidden !== "boolean") {
      Store_default.setConfig("isHidden", false);
    }
    let width = Store_default.getConfig("width");
    if (!width) {
      Store_default.setConfig("width", DEFAULT_NOTES_CONFIG.width);
    }
    let height = Store_default.getConfig("height");
    if (!height) {
      Store_default.setConfig("height", DEFAULT_NOTES_CONFIG.height);
    }
    let position = Store_default.getConfig("position");
    if (!position) {
      Store_default.setConfig("position", DEFAULT_NOTES_CONFIG.position);
    }
    let notes = Store_default.getState("notes");
    if (!notes) {
      Store_default.setState("notes", DEFAULT_NOTES);
    }
  }
  initPanelButtons() {
    this.initConfigPanelButton();
    this.initAddNotePanelButton();
    this.initShowNotesPanelButton();
  }
  initAddNotePanelButton() {
    const addNoteButton = this.addPanelButton({
      role: "Add note",
      dontCreateMenu: false
    });
    addNoteButton.setLabel("+");
    addNoteButton.menu.addAction("Text", () => this.addNote(NOTE_TYPES.TEXT));
    addNoteButton.menu.addAction("Image", () => this.addNote(NOTE_TYPES.IMAGE));
    addNoteButton.menu.addAction("Tasks", () => this.addNote(NOTE_TYPES.TASKS));
    addNoteButton.menu.addAction(
      "Workspace",
      () => this.addNote(NOTE_TYPES.WORKSPACE)
    );
    this.addNoteButton = addNoteButton;
  }
  initShowNotesPanelButton() {
    const showNotesButton = this.addPanelButton({ role: "Indicator" });
    showNotesButton.setStates([
      {
        state: true,
        label: "\u25BC"
      },
      {
        state: false,
        label: "\u25B2"
      }
    ]);
    showNotesButton.setState(Store_default.getConfig("isHidden"));
    showNotesButton.connect("button-press-event", () => {
      let isHidden = !Store_default.getConfig("isHidden");
      Store_default.setConfig("isHidden", isHidden);
      showNotesButton.setState(isHidden);
      this.showNotes();
    });
    this.showNotesButton = showNotesButton;
  }
  initConfigPanelButton() {
    const configButton = this.configButton || this.addPanelButton({
      role: "Config",
      dontCreateMenu: false
    });
    configButton.setLabel("\u2699");
    configButton.menu.removeAll();
    configButton.menu.addMenuItem(
      new PopupMenu.PopupSeparatorMenuItem("Position")
    );
    configButton.menu.addAction(
      "Top",
      () => this.setPosition(POSITION_TYPES.TOP)
    );
    configButton.menu.addAction(
      "Left",
      () => this.setPosition(POSITION_TYPES.LEFT)
    );
    configButton.menu.addAction(
      "Right",
      () => this.setPosition(POSITION_TYPES.RIGHT)
    );
    configButton.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem("Size"));
    Object.values(SIZES).forEach(({ width, height, label }) => {
      let isActive = width === Store_default.getConfig("width");
      configButton.menu.addAction(
        `${label} (${width}x${height}) ${isActive ? "\u2713" : ""}`,
        () => {
          Store_default.setConfig("width", width);
          Store_default.setConfig("height", height);
          this.initConfigPanelButton();
          this.showNotes();
        }
      );
    });
    this.configButton = configButton;
  }
  initWidget() {
    this.widget = new St10.Widget({
      width: global.screen_width,
      height: 100,
      reactive: true
    });
    this.widget.set_offscreen_redirect(Clutter8.OffscreenRedirect.ALWAYS);
    Main2.ctrlAltTabManager.addGroup(
      this.widget,
      "Simple Notes",
      "focus-top-bar-symbolic",
      { sortGroup: CtrlAltTab.SortGroup.TOP }
    );
    global.display.connect("workareas-changed", () => this.setPositions());
    Main2.layoutManager.connect("monitors-changed", () => this.setPositions());
    this.widget.connect("destroy", () => {
      Main2.layoutManager.removeChrome(this.widget);
    });
  }
  initNotesBox() {
    this.notesBox = new St10.BoxLayout({
      vertical: false,
      reactive: true
    });
    const scrollView = new St10.ScrollView({
      hscrollbar_policy: St10.PolicyType.AUTOMATIC,
      vscrollbar_policy: St10.PolicyType.NEVER,
      overlay_scrollbars: true,
      reactive: true
    });
    scrollView.add_actor(this.notesBox);
    this.scrollView = scrollView;
    this.widget.add_child(this.scrollView);
    this.showNotes();
  }
  setPosition(position) {
    let oldPosition = Store_default.getConfig("position");
    if (oldPosition === POSITION_TYPES.TOP) {
      Main2.layoutManager.panelBox.remove_child(this.widget);
    } else {
      Main2.layoutManager.removeChrome(this.widget);
    }
    if (position === POSITION_TYPES.TOP) {
      Main2.layoutManager.panelBox.add_child(this.widget);
    } else {
      Main2.layoutManager.addChrome(this.widget, {
        affectsStruts: true,
        trackFullscreen: true,
        affectsInputRegion: true
      });
    }
    Store_default.setConfig("position", position);
    this.setPositions();
  }
  setPositions() {
    let position = Store_default.getConfig("position");
    let shouldBeHidden = Store_default.getConfig("isHidden");
    if (position === POSITION_TYPES.TOP) {
      Main2.layoutManager.panelBox.remove_child(this.widget);
    } else {
      Main2.layoutManager.removeChrome(this.widget);
    }
    if (shouldBeHidden) {
      this.widget.hide();
      return;
    }
    let { notesWidth, notesHeight } = this.getNotesWidthAndHeight();
    const vertical = position !== POSITION_TYPES.TOP;
    const widgetWidth = vertical ? notesWidth + 20 : global.screen_width;
    const widgetHeight = vertical ? global.screen_height - Main2.layoutManager.panelBox.height - 20 : notesHeight + 20;
    const x = position === POSITION_TYPES.RIGHT ? global.screen_width - widgetWidth : 0;
    const y = Main2.layoutManager.panelBox.height;
    this.widget.width = widgetWidth;
    this.widget.height = widgetHeight;
    this.widget.vertical = vertical;
    this.widget.x = x;
    this.widget.y = y;
    this.notesBox.vertical = vertical;
    this.scrollView.width = widgetWidth;
    this.scrollView.height = widgetHeight;
    this.scrollView.hscrollbar_policy = vertical ? St10.PolicyType.NEVER : St10.PolicyType.AUTOMATIC;
    this.scrollView.vscrollbar_policy = vertical ? St10.PolicyType.AUTOMATIC : St10.PolicyType.NEVER;
    if (position === POSITION_TYPES.TOP) {
      Main2.layoutManager.panelBox.add_child(this.widget);
    } else {
      Main2.layoutManager.addChrome(this.widget, {
        affectsStruts: true,
        affectsInputRegion: true,
        trackFullscreen: true
      });
    }
    this.widget.show();
  }
  showNotes() {
    this.notesBox.destroy_all_children();
    this.setPositions();
    let notes = Store_default.getState("notes");
    let { notesWidth, notesHeight } = this.getNotesWidthAndHeight();
    this.widget.set_height(notesHeight + 10);
    this.widget.queue_relayout();
    notes.forEach((note, id2) => {
      let options = {
        id: id2,
        width: notesWidth,
        height: notesHeight,
        onUpdate: () => {
          this.showNotes();
          return false;
        }
      };
      let instance = null;
      switch (note.type) {
        case NOTE_TYPES.TEXT:
          instance = new TextNote(options);
          break;
        case NOTE_TYPES.IMAGE:
          instance = new ImageNote(options);
          break;
        case NOTE_TYPES.TASKS:
          instance = new TasksNote(options);
          break;
        case NOTE_TYPES.WORKSPACE:
          instance = new WorkspaceNote(options);
          break;
      }
      if (!instance) {
        throw new Error(`Invalid note type: ${note.type}`);
      }
      this.notesBox.add_child(instance.box);
    });
  }
  getNotesWidthAndHeight() {
    let notesWidth = Store_default.getConfig("width");
    let notesHeight = Math.trunc(notesWidth / 16 * 9);
    return { notesWidth, notesHeight };
  }
  addNote(type) {
    if (!type) {
      return;
    }
    if (Object.values(NOTE_TYPES).indexOf(type) === -1) {
      throw new Error(`Invalid note type: ${type}`);
    }
    createNewNote({
      type,
      onUpdate: () => {
        this.showNotes();
        return false;
      }
    });
  }
};
var Extension_default = Extension2;

// lib/index.js
var id = "org.gnome.shell.extensions.side-notes";
function init() {
  try {
    return new Extension_default(id);
  } catch (error) {
    logError(error);
  }
}
