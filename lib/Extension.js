/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import BaseExtension from './BaseExtension';
const { main: Main, ctrlAltTab: CtrlAltTab } = imports.ui;
const { St, Clutter } = imports.gi;

/*
    A note is an object with the following properties:
    {
      title: string,
      type: string (text, tasks, image, video),
      content: string | tasks array,
      color: string (primary | default | success | info | warning)
    }

    A task is an object with the following properties:
    {
      title: string,
      status: string (todo | doing | done)
      isDone: boolean
    }
  */

const defaultNotes = [
  {
    title: 'Note 1',
    type: 'text',
    content: 'This is a text note',
    color: 'primary'
  },
  {
    title: 'Note 2',
    type: 'tasks',
    content: [
      {
        title: 'Task 1',
        status: 'todo',
        isDone: false
      },
      {
        title: 'Task 2',
        status: 'doing',
        isDone: false
      },
      {
        title: 'Task 3',
        status: 'done',
        isDone: true
      }
    ],
    color: 'default'
  }
];

const defaultNotesConfig = {
  maxWidth: 300,
  items: 5,
  height: 100,
  colors: {
    primary: '#3244ad',
    accent: '#953ca5',
    success: '#2ab7a9',
    info: '#00c3e0',
    warning: '#bf7921',
    danger: '#bb2626',
    default: '#646c8a'
  }
};

const NOTE_TYPES = {
  TEXT: 'text',
  TASKS: 'tasks',
  IMAGE: 'image',
  VIDEO: 'video'
};

class Note {
  constructor({ title, type, content, color, width, height, onUpdate }) {
    this.box = new St.BoxLayout({
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

  setTitle(prefix = '') {
    const titleText = new St.Label({
      text: `${prefix} ${this.title}`.trim(),
      clip_to_allocation: true,
      reactive: true,
      style:
        'font-weight: bold;font-size: 14px;color: #fff; padding: 5px; background-color: rgba(0, 0, 0, 0.2);border-radius: 5px 5px 0 0;'
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

    const contentText = new St.Label({
      text: this.content,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 5px;'
    });

    this.box.add_child(contentText);
  }

  // Creates a task box
  // The title is aligned to the left
  // The status is aligned to the center
  // And the done button is aligned to the right
  getTaskBox({ title, onClick }) {
    const taskBox = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 2px;'
    });

    const taskTitle = new St.Label({
      text: title,
      clip_to_allocation: true,
      reactive: true,
      x_align: Clutter.ActorAlign.START,
      x_expand: true
    });

    const taskSwitch = new St.Button({
      reactive: true,
      can_focus: true,
      x_align: Clutter.ActorAlign.END,
      y_align: Clutter.ActorAlign.CENTER,
      child: new St.Label({
        text: 'Done',
        style: 'padding: 5px;font-size: 10px;'
      }),
      style: 'border-radius: 5px; background-color: rgba(0, 0, 0, 0.2);'
    });

    taskSwitch.connect('clicked', onClick);
    // Change background of the button when the mouse is over it
    taskSwitch.connect('enter-event', () => {
      taskSwitch.set_style(
        'border-radius: 5px; background-color: rgba(0, 0, 0, 0.4);'
      );
    });
    taskSwitch.connect('leave-event', () => {
      taskSwitch.set_style(
        'border-radius: 5px; background-color: rgba(0, 0, 0, 0.2);'
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

    const tasksBox = new St.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 5px;'
    });

    // Show only the first two undone tasks
    let items = 0;

    // Crete a task box for each task and add them a switch button to mark them as done
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
            this.content[taskBox.idx].isDone =
              !this.content[taskBox.idx].isDone;
            this.update();
          }
        });
        taskBox.idx = i;

        tasksBox.add_child(taskBox);
        items += 1;
      }
    }

    // If there are no undone tasks, show a message
    if (items === 0) {
      const noTasksText = new St.Label({
        text: 'No tasks to do!',
        clip_to_allocation: true,
        reactive: true,
        style: 'padding: 5px;',
        opacity: 150,
        x_align: Clutter.ActorAlign.CENTER
      });

      tasksBox.add_child(noTasksText);
    }

    this.box.add_child(tasksBox);
  }

  setImageNote() {}

  setVideoNote() {}

  update() {
    if (typeof this.onUpdate === 'function' && this.onUpdate() === false) {
      return;
    }

    // Remove all children from the box and re-create the note
    this.box.destroy_all_children();
    this.constructType();
  }
}

class Extension extends BaseExtension {
  enable() {
    super.enable();

    // Inits the config and state of the extension
    this.initConfigAndState();

    // Inits the panel button behavior to toggle the notes box
    this.initPanelButton();

    // Create a new St.Widget
    this.widget = new St.Widget({
      width: global.screen_width,
      height: 100,
      clip_to_allocation: true,
      reactive: true
    });

    // Prevent maximized windows from drawing over the widget
    this.widget.set_offscreen_redirect(Clutter.OffscreenRedirect.ALWAYS);

    // Add the widget to the top of the screen
    Main.layoutManager.panelBox.add(this.widget);
    Main.ctrlAltTabManager.addGroup(
      this.widget,
      'Simple Notes',
      'focus-top-bar-symbolic',
      { sortGroup: CtrlAltTab.SortGroup.TOP }
    );
    global.display.connect('workareas-changed', () =>
      this.widget.queue_relayout()
    );

    // init the notes box
    this.initNotesBox();
  }

  disable() {
    super.disable();
  }

  initConfigAndState() {
    let isHidden = this.getConfig('isHidden');
    if (isHidden === undefined || isHidden === null) {
      this.setConfig('isHidden', false);
    }

    let notesConfig = this.getConfig('notes');
    if (!notesConfig) {
      this.setConfig('notes', defaultNotesConfig);
    }

    let notes = this.getState('notes');
    if (!notes) {
      this.setState('notes', defaultNotes);
    }
  }

  initPanelButton() {
    this.panelButton.setLabels({ on: 'Hide notes', off: 'Show notes' });
    this.panelButton.setToggleState(this.getConfig('isHidden'));
    this.panelButton.connect('button-press-event', () => {
      let isHidden = !this.getConfig('isHidden');
      this.setConfig('isHidden', isHidden);
      this.panelButton.setToggleState(isHidden);
      this.showNotes();
    });
  }

  initNotesBox() {
    // Create a box that will contain all the notes
    this.notesBox = new St.BoxLayout({
      vertical: false,
      width: global.screen_width,
      clip_to_allocation: true,
      reactive: true
    });

    // Add the notes box to the widget
    this.widget.add_child(this.notesBox);

    this.showNotes();
  }

  showNotes() {
    let shouldBeHidden = this.getConfig('isHidden');

    if (shouldBeHidden) {
      // Hide the widget if it's not hidden
      if (this.widget.visible) {
        this.widget.hide();
      }
      return;
    }

    // Show the widget if it's hidden
    if (!this.widget.visible) {
      this.widget.show();
    }

    let notes = this.getState('notes');
    let notesConfig = this.getConfig('notes');

    let notesWidth = Math.abs(global.screen_width / notesConfig.items);
    if (notesWidth > notesConfig.maxWidth) {
      notesWidth = notesConfig.maxWidth;
    }

    let maxNotes = Math.abs(global.screen_width / notesWidth);

    // Remove all the notes from the notes box
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
}

export default Extension;
