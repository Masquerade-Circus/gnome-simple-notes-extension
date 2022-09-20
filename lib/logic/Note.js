/* eslint-disable gjs/no-js-class */
'use strict';

import { COLORS, NOTE_TYPES } from './constants';

import NoteModal from './NoteModal';
import Store from '../core/Store';

const { St, Clutter } = imports.gi;
const { util: Util } = imports.misc;

class Note {
  constructor({ id, width, height, onUpdate }) {
    const notes = Store.getState('notes') || [];
    const note = notes[id];

    if (!note) {
      throw new Error('Note not found');
    }

    this.box = new St.BoxLayout({
      vertical: true,
      width,
      height,
      clip_to_allocation: true,
      reactive: true,
      style: `background-color: ${
        COLORS[note.color]
      };border-radius: 5px;margin-right: 5px;`
    });

    this.box.connect('button-press-event', () => {
      new NoteModal({
        id: this.id,
        onUpdate: () => this.update()
      });
    });

    this.id = id;
    this.title = note.title;
    this.type = note.type;
    this.content = note.content;
    this.color = note.color;
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
    }
  }

  // Creates a text note
  // When double clicked, the note is opened in a popup window
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

  setImageNote() {
    let style = `background-size: cover;background-image: url("${this.content}");border-radius: 5px;`;
    const imageBox = new St.BoxLayout({
      clip_to_allocation: true,
      reactive: true,
      can_focus: true,
      style,
      x_expand: true,
      y_expand: true
    });

    this.box.add_child(imageBox);
  }

  update() {
    if (typeof this.onUpdate === 'function' && this.onUpdate() === false) {
      return;
    }

    // Remove all children from the box and re-create the note
    this.box.destroy_all_children();
    this.constructType();
  }
}

export default Note;
