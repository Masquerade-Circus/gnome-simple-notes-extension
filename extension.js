"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/BaseExtension.js
var GLib, St, Clutter, Gio, main, panelMenu, ExtensionUtils, Me, Extension, BaseExtension_default;
var init_BaseExtension = __esm({
  "lib/BaseExtension.js"() {
    "use strict";
    ({ GLib, St, Clutter, Gio } = imports.gi);
    ({ main, panelMenu } = imports.ui);
    ExtensionUtils = imports.misc.extensionUtils;
    Me = ExtensionUtils.getCurrentExtension();
    Extension = class {
      constructor(id2) {
        this.id = id2;
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
      enable() {
        this.state = [];
        this.schema = Gio.SettingsSchemaSource.new_from_directory(
          Me.dir.get_child("schemas").get_path(),
          Gio.SettingsSchemaSource.get_default(),
          false
        );
        this.settings = new Gio.Settings({
          settings_schema: this.schema.lookup(this.id, true)
        });
        this.loadSettings();
        const panelButton = new panelMenu.Button(1, Me.metadata.name);
        panelButton.set_x_expand(true);
        panelButton.set_can_focus(true);
        panelButton.set_reactive(true);
        let label = new St.Label({
          text: "...",
          opacity: 150,
          y_align: Clutter.ActorAlign.CENTER
        });
        panelButton.add_child(label);
        panelButton.label = label;
        panelButton.updateLabel = (value) => panelButton.label.set_text(value || "...");
        panelButton.setLabels = ({ on, off }) => {
          panelButton.onLabel = on;
          panelButton.offLabel = off;
        };
        panelButton.setToggleState = (value) => panelButton.updateLabel(
          value ? panelButton.onLabel : panelButton.offLabel
        );
        panelButton.setLabels({ on: "ON", off: "OFF" });
        panelButton.updateLabel();
        this.panelButton = panelButton;
        main.panel.addToStatusArea(
          `${Me.metadata.name} Indicator`,
          this.panelButton,
          1,
          "center"
        );
      }
      disable() {
        this.panelButton.destroy();
        this.saveSettings();
      }
      loadSettings() {
        let settings = this.settings.get_value("store");
        if (!settings || settings instanceof GLib.Variant === false) {
          return null;
        }
        let unpacked = settings.deep_unpack();
        this.log("loadSettings", "store", unpacked);
        this.store = JSON.parse(unpacked);
      }
      saveSettings() {
        this.log("saveSettings", this.store);
        const settings = new GLib.Variant("s", JSON.stringify(this.store));
        this.settings.set_value("store", settings);
      }
      setState(key, value) {
        this.log("setState", key, value);
        this.store.state = this.store.state || {};
        this.store.state[key] = value;
        this.saveSettings();
      }
      getState(key) {
        this.log("getState", key, this.store.state && this.store.state[key]);
        return this.store.state ? this.store.state[key] : null;
      }
      setConfig(key, value) {
        this.log("setConfig", key, value);
        this.store.config = this.store.config || {};
        this.store.config[key] = value;
        this.saveSettings();
      }
      getConfig(key) {
        this.log("getConfig", key, this.store.config && this.store.config[key]);
        return this.store.config ? this.store.config[key] : null;
      }
    };
    BaseExtension_default = Extension;
  }
});

// lib/Extension.js
var Extension_exports = {};
__export(Extension_exports, {
  default: () => Extension_default
});
var Main, CtrlAltTab, St2, Clutter2, defaultNotes, defaultNotesConfig, NOTE_TYPES, Note, Extension2, Extension_default;
var init_Extension = __esm({
  "lib/Extension.js"() {
    "use strict";
    init_BaseExtension();
    ({ main: Main, ctrlAltTab: CtrlAltTab } = imports.ui);
    ({ St: St2, Clutter: Clutter2 } = imports.gi);
    defaultNotes = [
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
      }
    ];
    defaultNotesConfig = {
      maxWidth: 300,
      items: 5,
      height: 100,
      colors: {
        primary: "#3244ad",
        accent: "#953ca5",
        success: "#2ab7a9",
        info: "#00c3e0",
        warning: "#bf7921",
        danger: "#bb2626",
        default: "#646c8a"
      }
    };
    NOTE_TYPES = {
      TEXT: "text",
      TASKS: "tasks",
      IMAGE: "image",
      VIDEO: "video"
    };
    Note = class {
      constructor({ title, type, content, color, width, height, onUpdate }) {
        this.box = new St2.BoxLayout({
          vertical: true,
          width,
          height,
          clip_to_allocation: true,
          reactive: true,
          style: `background-color: ${color};border-radius: 5px;margin-right: 5px;`
        });
        this.title = title;
        this.type = type;
        this.content = content;
        this.color = color;
        this.width = width;
        this.height = height;
        this.onUpdate = onUpdate;
        this.constructType();
      }
      setTitle(prefix = "") {
        const titleText = new St2.Label({
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
          case NOTE_TYPES.VIDEO:
            this.setVideoNote();
            break;
        }
      }
      setTextNote() {
        this.setTitle();
        const contentText = new St2.Label({
          text: this.content,
          clip_to_allocation: true,
          reactive: true,
          style: "padding: 5px;"
        });
        this.box.add_child(contentText);
      }
      getTaskBox({ title, onClick }) {
        const taskBox = new St2.BoxLayout({
          vertical: false,
          clip_to_allocation: true,
          reactive: true,
          style: "padding: 2px;"
        });
        const taskTitle = new St2.Label({
          text: title,
          clip_to_allocation: true,
          reactive: true,
          x_align: Clutter2.ActorAlign.START,
          x_expand: true
        });
        const taskSwitch = new St2.Button({
          reactive: true,
          can_focus: true,
          x_align: Clutter2.ActorAlign.END,
          y_align: Clutter2.ActorAlign.CENTER,
          child: new St2.Label({
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
        const tasksBox = new St2.BoxLayout({
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
          const noTasksText = new St2.Label({
            text: "No tasks to do!",
            clip_to_allocation: true,
            reactive: true,
            style: "padding: 5px;",
            opacity: 150,
            x_align: Clutter2.ActorAlign.CENTER
          });
          tasksBox.add_child(noTasksText);
        }
        this.box.add_child(tasksBox);
      }
      setImageNote() {
      }
      setVideoNote() {
      }
      update() {
        if (typeof this.onUpdate === "function" && this.onUpdate() === false) {
          return;
        }
        this.box.destroy_all_children();
        this.constructType();
      }
    };
    Extension2 = class extends BaseExtension_default {
      enable() {
        super.enable();
        this.initConfigAndState();
        this.initPanelButton();
        this.widget = new St2.Widget({
          width: global.screen_width,
          height: 100,
          clip_to_allocation: true,
          reactive: true
        });
        this.widget.set_offscreen_redirect(Clutter2.OffscreenRedirect.ALWAYS);
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
        super.disable();
      }
      initConfigAndState() {
        let isHidden = this.getConfig("isHidden");
        if (isHidden === void 0 || isHidden === null) {
          this.setConfig("isHidden", false);
        }
        let notesConfig = this.getConfig("notes");
        if (!notesConfig) {
          this.setConfig("notes", defaultNotesConfig);
        }
        let notes = this.getState("notes");
        if (!notes) {
          this.setState("notes", defaultNotes);
        }
      }
      initPanelButton() {
        this.panelButton.setLabels({ on: "Hide notes", off: "Show notes" });
        this.panelButton.setToggleState(this.getConfig("isHidden"));
        this.panelButton.connect("button-press-event", () => {
          let isHidden = !this.getConfig("isHidden");
          this.setConfig("isHidden", isHidden);
          this.panelButton.setToggleState(isHidden);
          this.showNotes();
        });
      }
      initNotesBox() {
        this.notesBox = new St2.BoxLayout({
          vertical: false,
          width: global.screen_width,
          clip_to_allocation: true,
          reactive: true
        });
        this.widget.add_child(this.notesBox);
        this.showNotes();
      }
      showNotes() {
        let shouldBeHidden = this.getConfig("isHidden");
        if (shouldBeHidden) {
          if (this.widget.visible) {
            this.widget.hide();
          }
          return;
        }
        if (!this.widget.visible) {
          this.widget.show();
        }
        let notes = this.getState("notes");
        let notesConfig = this.getConfig("notes");
        let notesWidth = Math.abs(global.screen_width / notesConfig.items);
        if (notesWidth > notesConfig.maxWidth) {
          notesWidth = notesConfig.maxWidth;
        }
        let maxNotes = Math.abs(global.screen_width / notesWidth);
        this.notesBox.destroy_all_children();
        for (let i = 0; i < maxNotes; i++) {
          let note = notes[i];
          if (!note) {
            break;
          }
          let instance = new Note({
            title: note.title,
            type: note.type,
            content: note.content,
            color: notesConfig.colors[note.color],
            width: notesWidth,
            height: notesConfig.height
          });
          this.notesBox.add_child(instance.box);
        }
      }
    };
    Extension_default = Extension2;
  }
});

// lib/DevExtension.js
var DevExtension_exports = {};
__export(DevExtension_exports, {
  default: () => DevExtension_default
});
var main2, popupMenu, Dev, DevExtension_default;
var init_DevExtension = __esm({
  "lib/DevExtension.js"() {
    "use strict";
    init_Extension();
    ({ main: main2, popupMenu } = imports.ui);
    Dev = class extends Extension_default {
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
      }
      disable() {
        global.context.unsafe_mode = false;
        this.unsafeMenuItem.destroy();
        this.unsafeMenuItem = null;
        super.disable();
      }
    };
    DevExtension_default = Dev;
  }
});

// lib/index.js
var { default: Dev2 } = (init_DevExtension(), __toCommonJS(DevExtension_exports));
var { default: Extension3 } = (init_Extension(), __toCommonJS(Extension_exports));
var isDev = true;
var id = "org.gnome.shell.extensions.side-notes";
function init() {
  try {
    if (isDev) {
      return new Dev2(id);
    }
    return new Extension3(id);
  } catch (error) {
    logError(error);
  }
}
//# sourceMappingURL=extension.js.map
