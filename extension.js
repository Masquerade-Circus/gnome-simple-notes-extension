"use strict";

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
      this.logDebug(...args);
    }
  }
  logInfo(...args) {
    if (this.logLevel <= LOG_LEVELS.INFO) {
      this.logDebug(...args);
    }
  }
  logWarn(...args) {
    if (this.logLevel <= LOG_LEVELS.WARN) {
      this.logDebug(...args);
    }
  }
  logError(...args) {
    if (this.logLevel <= LOG_LEVELS.ERROR) {
      this.logDebug(...args);
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
};
var Store_default = new Store();

// lib/logic/constants.js
var NOTE_TYPES = {
  TEXT: "text",
  TASKS: "tasks",
  IMAGE: "image"
};
var NOTE_MODAL = {
  maxWidth: 640,
  maxHeight: Math.abs(640 / 16 * 9)
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
        status: "todo",
        isDone: false
      },
      {
        title: "Task 2",
        status: "doing",
        isDone: false
      },
      {
        title: "Task 3",
        status: "done",
        isDone: true
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
var DEFAULT_NOTES_CONFIG = {
  maxWidth: 240,
  items: 5
};

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
  constructor({ id: id2, onUpdate, isNew }) {
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
    this.widget = null;
    this.createWidget();
    this.update();
  }
  constructBody() {
    throw new Error("Not implemented");
  }
  createWidget() {
    const widget = new ModalDialog.ModalDialog({});
    global.display.connect("workareas-changed", () => widget.queue_relayout());
    widget.setButtons([
      {
        label: "Save",
        action: () => this.save(),
        key: Clutter2.KEY_S
      },
      {
        label: "Delete",
        action: () => this.delete()
      },
      {
        label: "Close",
        action: () => this.close(),
        key: Clutter2.KEY_Escape
      }
    ]);
    widget.contentLayout.style_class = "note-content-layout";
    widget.contentLayout.style = `background-color: ${COLORS[this.color]};border-radius: 5px;`;
    widget.contentLayout.width = NOTE_MODAL.maxWidth;
    widget.contentLayout.height = NOTE_MODAL.maxHeight;
    this.widget = widget;
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
      this.onUpdate();
    }
  }
  delete() {
    let notes = Store_default.getState("notes");
    notes.splice(this.id, 1);
    Store_default.setState("notes", notes);
    this.hide();
    this.widget.destroy();
    if (typeof this.onUpdate === "function") {
      this.onUpdate();
    }
  }
  close() {
    this.hide();
    if (this.isNew) {
      this.delete();
    }
    this.widget.destroy();
  }
  update() {
    if (!this.widget) {
      throw new Error("Widget not created");
    }
    this.widget.contentLayout.destroy_all_children();
    this.constructBody();
    this.show();
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
var TasksNoteModal = class extends NoteModal {
  constructor({ id: id2, onUpdate }) {
    super({ id: id2, onUpdate });
  }
  constructBody() {
  }
};

// lib/logic/modals/TextNoteModal.js
var { St: St4, Clutter: Clutter4, Pango } = imports.gi;
var TextNoteModal = class extends NoteModal {
  constructor({ id: id2, onUpdate }) {
    super({ id: id2, onUpdate });
  }
  constructBody() {
    this.setTitle();
    const textArea = new St4.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 5px;",
      x_align: Clutter4.ActorAlign.FILL,
      y_align: Clutter4.ActorAlign.FILL,
      x_expand: true,
      y_expand: true
    });
    const text = new St4.Entry({
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
    clutterText.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
    clutterText.connect("text-changed", () => {
      this.content = text.get_text();
    });
    textArea.add_child(text);
    textArea.connect("button-press-event", () => {
      text.grab_key_focus();
    });
    this.widget.contentLayout.add_child(textArea);
    this.setColorButtons();
  }
};

// lib/logic/notes/Note.js
var { St: St5 } = imports.gi;
var Note = class {
  constructor({ id: id2, width, height, onUpdate }) {
    const notes = Store_default.getState("notes") || [];
    const note = notes[id2];
    if (!note) {
      throw new Error("Note not found");
    }
    this.box = new St5.BoxLayout({
      vertical: true,
      width,
      height,
      clip_to_allocation: true,
      reactive: true,
      style: `background-color: ${COLORS[note.color]};border-radius: 5px;margin-right: 5px;`
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
    this.constructBody();
  }
  setTitle(prefix = "") {
    const titleText = new St5.Label({
      text: `${prefix} ${this.title}`.trim(),
      clip_to_allocation: true,
      reactive: true,
      style: "font-weight: bold;font-size: 14px;color: #fff; padding: 5px; background-color: rgba(0, 0, 0, 0.2);border-radius: 5px 5px 0 0;"
    });
    this.box.add_child(titleText);
  }
  constructBody() {
    throw new Error("Method not implemented");
  }
  update() {
    if (typeof this.onUpdate === "function" && this.onUpdate() === false) {
      return;
    }
    this.box.destroy_all_children();
    this.constructBody();
  }
};

// lib/logic/notes/ImageNote.js
var { St: St6 } = imports.gi;
var ImageNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
  }
  constructBody() {
    const imageBox = new St6.BoxLayout({
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
var { St: St7, Clutter: Clutter5 } = imports.gi;
var TasksNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
  }
  constructBody() {
    let doneTasks = this.content.reduce((acc, task) => {
      if (task.isDone) {
        acc++;
      }
      return acc;
    }, 0);
    this.setTitle(`(${doneTasks}/${this.content.length})`);
    const tasksBox = new St7.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 5px;"
    });
    let items = 0;
    for (let i = 0; i < this.content.length; i++) {
      if (items === 2) {
        break;
      }
      if (!this.content[i].isDone) {
        const { title, status, isDone } = this.content[i];
        let taskBox = this.getTaskBox({
          title,
          status,
          isDone,
          onClick: () => {
            this.content[taskBox.idx].isDone = !this.content[taskBox.idx].isDone;
            this.update();
          }
        });
        taskBox.idx = i;
        tasksBox.add_child(taskBox);
        items += 1;
      }
    }
    if (items === 0) {
      const noTasksText = new St7.Label({
        text: "No tasks to do!",
        clip_to_allocation: true,
        reactive: true,
        style: "padding: 5px;",
        opacity: 150,
        x_align: Clutter5.ActorAlign.CENTER
      });
      tasksBox.add_child(noTasksText);
    }
    this.box.add_child(tasksBox);
  }
  getTaskBox({ title, onClick }) {
    const taskBox = new St7.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 2px;"
    });
    const taskTitle = new St7.Label({
      text: title,
      clip_to_allocation: true,
      reactive: true,
      x_align: Clutter5.ActorAlign.START,
      x_expand: true
    });
    const taskSwitch = new St7.Button({
      reactive: true,
      can_focus: true,
      x_align: Clutter5.ActorAlign.END,
      y_align: Clutter5.ActorAlign.CENTER,
      child: new St7.Label({
        text: "Done",
        style: "padding: 5px;font-size: 10px;"
      }),
      style: "border-radius: 5px; background-color: rgba(0, 0, 0, 0.2);"
    });
    taskSwitch.connect("clicked", onClick);
    taskSwitch.connect("enter-event", () => {
      taskSwitch.set_style(
        "border-radius: 5px; background-color: rgba(0, 0, 0, 0.4);"
      );
    });
    taskSwitch.connect("leave-event", () => {
      taskSwitch.set_style(
        "border-radius: 5px; background-color: rgba(0, 0, 0, 0.2);"
      );
    });
    taskBox.add_child(taskTitle);
    taskBox.add_child(taskSwitch);
    return taskBox;
  }
};

// lib/logic/notes/TextNote.js
var { St: St8 } = imports.gi;
var TextNote = class extends Note {
  constructor({ id: id2, width, height, onUpdate }) {
    super({ id: id2, width, height, onUpdate });
  }
  constructBody() {
    this.setTitle();
    const contentText = new St8.Label({
      text: this.content,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 5px;"
    });
    this.box.add_child(contentText);
  }
};

// lib/logic/modals/createNewNote.js
var createNewNote = ({ type, onUpdate }) => {
  let notes = Store_default.getState("notes");
  let id2 = notes.length;
  notes.push({
    title: "New note",
    type,
    content: "",
    color: COLOR_TYPES.DEFAULT
  });
  switch (type) {
    case NOTE_TYPES.TEXT:
      new TextNoteModal({ id: id2, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.TASKS:
      new TasksNoteModal({ id: id2, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.IMAGE:
      new ImageNoteModal({ id: id2, onUpdate, isNew: true });
      break;
  }
};

// lib/logic/Extension.js
var { main: Main, ctrlAltTab: CtrlAltTab } = imports.ui;
var { St: St9, Clutter: Clutter6 } = imports.gi;
var Extension2 = class extends BaseExtension_default {
  constructor(id2) {
    super(id2);
    this.widget = null;
    this.addNoteButton = null;
    this.showNotesButton = null;
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
  }
  initConfigAndState() {
    let isHidden = Store_default.getConfig("isHidden");
    if (isHidden === void 0 || isHidden === null) {
      Store_default.setConfig("isHidden", false);
    }
    let notesConfig = Store_default.getConfig("notes");
    if (!notesConfig) {
      Store_default.setConfig("notes", DEFAULT_NOTES_CONFIG);
    }
    let notes = Store_default.getState("notes");
    if (notes) {
      Store_default.setState("notes", DEFAULT_NOTES);
    }
  }
  initPanelButtons() {
    const addNoteButton = this.addPanelButton({
      role: "Add note",
      dontCreateMenu: false
    });
    addNoteButton.setLabel("+");
    addNoteButton.menu.addAction("Text", () => this.addNote(NOTE_TYPES.TEXT));
    addNoteButton.menu.addAction("Image", () => this.addNote(NOTE_TYPES.IMAGE));
    addNoteButton.menu.addAction("Tasks", () => this.addNote(NOTE_TYPES.TASKS));
    this.addNoteButton = addNoteButton;
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
  initWidget() {
    this.widget = new St9.Widget({
      width: global.screen_width,
      height: 100,
      clip_to_allocation: true,
      reactive: true
    });
    this.widget.set_offscreen_redirect(Clutter6.OffscreenRedirect.ALWAYS);
    Main.layoutManager.panelBox.add(this.widget);
    Main.ctrlAltTabManager.addGroup(
      this.widget,
      "Simple Notes",
      "focus-top-bar-symbolic",
      { sortGroup: CtrlAltTab.SortGroup.TOP }
    );
    global.display.connect(
      "workareas-changed",
      () => this.widget.queue_relayout()
    );
  }
  initNotesBox() {
    this.notesBox = new St9.BoxLayout({
      vertical: false,
      width: global.screen_width,
      clip_to_allocation: true,
      reactive: true
    });
    this.widget.add_child(this.notesBox);
    this.showNotes();
  }
  showNotes() {
    this.notesBox.destroy_all_children();
    let shouldBeHidden = Store_default.getConfig("isHidden");
    if (shouldBeHidden) {
      if (this.widget.visible) {
        this.widget.hide();
      }
      return;
    }
    if (!this.widget.visible) {
      this.widget.show();
    }
    let notes = Store_default.getState("notes");
    let { notesWidth, notesHeight } = this.getWidthAndHeight();
    if (this.widget.height !== notesHeight) {
      this.widget.set_height(notesHeight);
      this.widget.queue_relayout();
    }
    let maxNotes = Math.abs(global.screen_width / notesWidth) - 1;
    for (let i = 0; i < maxNotes; i++) {
      let note = notes[i];
      if (!note) {
        break;
      }
      let options = {
        id: i,
        width: notesWidth,
        height: notesHeight,
        onUpdate: () => {
          Store_default.logInfo("Note updated");
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
      }
      if (!instance) {
        throw new Error(`Invalid note type: ${note.type}`);
      }
      this.notesBox.add_child(instance.box);
    }
  }
  getWidthAndHeight() {
    let notesConfig = Store_default.getConfig("notes");
    let notesWidth = Math.abs(global.screen_width / notesConfig.items);
    if (notesWidth > notesConfig.maxWidth) {
      notesWidth = notesConfig.maxWidth;
    }
    let notesHeight = Math.abs(notesWidth / 16 * 9);
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
        Store_default.logInfo("Note updated");
        this.showNotes();
        return false;
      }
    });
  }
};
var Extension_default = Extension2;

// lib/core/DevExtension.js
var { main: main2, popupMenu } = imports.ui;
var Dev = class extends Extension_default {
  constructor(id2) {
    super(id2);
    this.unsafeMenuItem = null;
  }
  enable() {
    global.context.unsafe_mode = true;
    this.unsafeMenuItem = new popupMenu.PopupSwitchMenuItem(
      "Unsafe Mode",
      global.context.unsafe_mode
    );
    this.unsafeMenuItem.connect("toggled", () => {
      global.context.unsafe_mode = this.unsafeMenuItem.state;
    });
    let insertAfter = main2.panel.statusArea.aggregateMenu._nightLight.menu;
    let pos = main2.panel.statusArea.aggregateMenu.menu._getMenuItems().findIndex((menu) => menu === insertAfter);
    main2.panel.statusArea.aggregateMenu.menu.addMenuItem(
      this.unsafeMenuItem,
      pos + 1
    );
    global.context.connect("notify::unsafe-mode", () => {
      if (this.unsafeMenuItem != null) {
        this.unsafeMenuItem.setToggleState(global.context.unsafe_mode);
      }
    });
    super.enable();
    Store_default.logLevel = LOG_LEVELS.INFO;
  }
  disable() {
    global.context.unsafe_mode = false;
    this.unsafeMenuItem.destroy();
    this.unsafeMenuItem = null;
    super.disable();
  }
};
var DevExtension_default = Dev;

// lib/index.js
var isDev = true;
var id = "org.gnome.shell.extensions.side-notes";
function init() {
  try {
    if (isDev) {
      return new DevExtension_default(id);
    }
    return new Extension_default(id);
  } catch (error) {
    let stack = error.stack.split("\n").map((line) => line.replace(/^\.*masquerade-circus.net\//, ""));
    error.stack = stack.join("\n");
    logError(error);
  }
}
//# sourceMappingURL=extension.js.map
