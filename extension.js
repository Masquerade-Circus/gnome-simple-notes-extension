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
    content: "https://picsum.photos/200/300",
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
    this.panelButton = null;
    this.label = null;
  }
  enable() {
    const panelButton = new panelMenu.Button(1, Me2.metadata.name);
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
    panelButton.updateLabel = (value) => panelButton.label.set_text(value || "...");
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
      panelButton.updateLabel(stateObj.label);
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
    this.panelButton = panelButton;
    main.panel.addToStatusArea(
      `${Me2.metadata.name} Indicator`,
      this.panelButton,
      1,
      "center"
    );
    Store_default.enable(this.id);
  }
  disable() {
    this.panelButton.destroy();
    Store_default.disable();
  }
};
var BaseExtension_default = Extension;

// lib/logic/NoteModal.js
var { St: St2, Clutter: Clutter2, Pango } = imports.gi;
var { modalDialog: ModalDialog } = imports.ui;
var NoteModal = class {
  constructor({ id: id2, onUpdate }) {
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
    this.widget = null;
    this.createWidget();
    this.constructType();
  }
  constructType() {
    switch (this.type) {
      case NOTE_TYPES.TEXT:
        this.setTextNote();
        break;
      case NOTE_TYPES.TASKS:
        this.setTasksNote();
        break;
      case NOTE_TYPES.IMAGE:
        this.setImageNote();
        break;
    }
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
    widget.open();
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
  setTextNote() {
    if (this.widget) {
      this.widget.contentLayout.destroy_all_children();
    }
    this.setTitle();
    const textArea = new St2.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 5px;",
      x_align: Clutter2.ActorAlign.FILL,
      y_align: Clutter2.ActorAlign.FILL,
      x_expand: true,
      y_expand: true
    });
    const text = new St2.Entry({
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
    this.widget.open();
  }
  setTasksNote() {
  }
  setImageNote() {
  }
  save() {
    this.update();
    let notes = Store_default.getState("notes");
    notes[this.id] = {
      title: this.title,
      type: this.type,
      content: this.content,
      color: this.color
    };
    Store_default.setState("notes", notes);
    this.widget.close();
    if (typeof this.onUpdate === "function") {
      this.onUpdate();
    }
  }
  delete() {
    let notes = Store_default.getState("notes");
    notes.splice(this.id, 1);
    Store_default.setState("notes", notes);
    this.widget.close();
    if (typeof this.onUpdate === "function") {
      this.onUpdate();
    }
  }
  close() {
    this.widget.close();
  }
  update() {
    this.constructType();
  }
};
var NoteModal_default = NoteModal;

// lib/logic/Note.js
var { St: St3, Clutter: Clutter3 } = imports.gi;
var { util: Util } = imports.misc;
var Note = class {
  constructor({ id: id2, width, height, onUpdate }) {
    const notes = Store_default.getState("notes") || [];
    const note = notes[id2];
    if (!note) {
      throw new Error("Note not found");
    }
    this.box = new St3.BoxLayout({
      vertical: true,
      width,
      height,
      clip_to_allocation: true,
      reactive: true,
      style: `background-color: ${COLORS[note.color]};border-radius: 5px;margin-right: 5px;`
    });
    this.id = id2;
    this.title = note.title;
    this.type = note.type;
    this.content = note.content;
    this.color = note.color;
    this.width = width;
    this.height = height;
    this.onUpdate = onUpdate;
    this.constructType();
  }
  setTitle(prefix = "") {
    const titleText = new St3.Label({
      text: `${prefix} ${this.title}`.trim(),
      clip_to_allocation: true,
      reactive: true,
      style: "font-weight: bold;font-size: 14px;color: #fff; padding: 5px; background-color: rgba(0, 0, 0, 0.2);border-radius: 5px 5px 0 0;"
    });
    this.box.add_child(titleText);
  }
  constructType() {
    switch (this.type) {
      case NOTE_TYPES.TEXT:
        this.setTextNote();
        break;
      case NOTE_TYPES.TASKS:
        this.setTasksNote();
        break;
      case NOTE_TYPES.IMAGE:
        this.setImageNote();
        break;
    }
  }
  setTextNote() {
    this.setTitle();
    const contentText = new St3.Label({
      text: this.content,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 5px;"
    });
    this.box.connect("button-press-event", () => {
      Store_default.logInfo("Double clicked");
      new NoteModal_default({
        id: this.id,
        onUpdate: () => this.update()
      });
    });
    this.box.add_child(contentText);
  }
  getTaskBox({ title, onClick }) {
    const taskBox = new St3.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: "padding: 2px;"
    });
    const taskTitle = new St3.Label({
      text: title,
      clip_to_allocation: true,
      reactive: true,
      x_align: Clutter3.ActorAlign.START,
      x_expand: true
    });
    const taskSwitch = new St3.Button({
      reactive: true,
      can_focus: true,
      x_align: Clutter3.ActorAlign.END,
      y_align: Clutter3.ActorAlign.CENTER,
      child: new St3.Label({
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
  setTasksNote() {
    let doneTasks = this.content.reduce((acc, task) => {
      if (task.isDone) {
        acc++;
      }
      return acc;
    }, 0);
    this.setTitle(`(${doneTasks}/${this.content.length})`);
    const tasksBox = new St3.BoxLayout({
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
      const noTasksText = new St3.Label({
        text: "No tasks to do!",
        clip_to_allocation: true,
        reactive: true,
        style: "padding: 5px;",
        opacity: 150,
        x_align: Clutter3.ActorAlign.CENTER
      });
      tasksBox.add_child(noTasksText);
    }
    this.box.add_child(tasksBox);
  }
  setImageNote() {
    let style = `background-size: cover;background-image: url("${this.content}");border-radius: 5px;`;
    const imageBox = new St3.BoxLayout({
      clip_to_allocation: true,
      reactive: true,
      can_focus: true,
      style,
      x_expand: true,
      y_expand: true
    });
    const imageButton = new St3.Button({
      clip_to_allocation: true,
      reactive: true,
      can_focus: true,
      style: "border-radius: 5px;",
      x_expand: true,
      y_expand: true
    });
    imageButton.connect("enter-event", () => {
      imageButton.set_style(
        `border-radius: 5px;background-color: rgba(0, 0, 0, 0.2);`
      );
    });
    imageButton.connect("leave-event", () => {
      imageButton.set_style(
        `border-radius: 5px;background-color: transparent;`
      );
    });
    imageButton.connect("clicked", () => {
      Util.spawn(["xdg-open", this.content]);
    });
    imageBox.add_child(imageButton);
    this.box.add_child(imageBox);
  }
  update() {
    if (typeof this.onUpdate === "function" && this.onUpdate() === false) {
      return;
    }
    this.box.destroy_all_children();
    this.constructType();
  }
};
var Note_default = Note;

// lib/logic/Extension.js
var {
  main: Main,
  ctrlAltTab: CtrlAltTab,
  modalDialog: ModalDialog2
} = imports.ui;
var { St: St4, Clutter: Clutter4 } = imports.gi;
var Extension2 = class extends BaseExtension_default {
  constructor(id2) {
    super(id2);
    this.widget = null;
  }
  enable() {
    super.enable();
    this.initConfigAndState();
    this.initPanelButton();
    this.widget = new St4.Widget({
      width: global.screen_width,
      height: 100,
      clip_to_allocation: true,
      reactive: true
    });
    this.widget.set_offscreen_redirect(Clutter4.OffscreenRedirect.ALWAYS);
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
    this.initNotesBox();
  }
  disable() {
    if (this.widget) {
      this.widget.destroy();
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
  initPanelButton() {
    this.panelButton.setStates([
      {
        state: true,
        label: "Show notes"
      },
      {
        state: false,
        label: "Hide notes"
      }
    ]);
    this.panelButton.setState(Store_default.getConfig("isHidden"));
    this.panelButton.connect("button-press-event", () => {
      let isHidden = !Store_default.getConfig("isHidden");
      Store_default.setConfig("isHidden", isHidden);
      this.panelButton.setState(isHidden);
      this.showNotes();
    });
  }
  initNotesBox() {
    this.notesBox = new St4.BoxLayout({
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
    maxNotes = 0;
    for (let i = 0; i < maxNotes; i++) {
      let note = notes[i];
      if (!note) {
        break;
      }
      let instance = new Note_default({
        id: i,
        width: notesWidth,
        height: notesHeight,
        onUpdate: () => {
          Store_default.logInfo("Note updated");
          this.showNotes();
          return false;
        }
      });
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
  showAddNoteModal() {
    const modal = new ModalDialog2.ModalDialog({});
    let title = new St4.Label({
      text: "Select note type",
      x_align: Clutter4.ActorAlign.CENTER,
      y_align: Clutter4.ActorAlign.CENTER,
      x_expand: true
    });
    modal.contentLayout.add_child(title);
    modal.setButtons([
      {
        label: "Text",
        action: () => {
          modal.close();
          this.showAddTextNoteModal();
        }
      },
      {
        label: "Image",
        action: () => {
          modal.close();
          this.showAddImageNoteModal();
        }
      },
      {
        label: "Tasks",
        action: () => {
          modal.close();
          this.showAddTasksNoteModal();
        }
      },
      {
        label: "Cancel",
        action: () => {
          modal.close();
        }
      }
    ]);
    modal.open();
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
