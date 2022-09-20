/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { NoteModal } from './NoteModal';

const { St, Clutter } = imports.gi;
const { checkBox: CheckBox } = imports.ui;

export class TasksNoteModal extends NoteModal {
  constructor({ id, onUpdate }) {
    super({ id, onUpdate });
  }

  constructBody() {
    // Add the title
    this.setTitle();

    // Add the tasks box
    this.createTasksBox();

    // Clone the tasks array to avoid mutating the original
    // If the user cancels the changes the oldContent will be restored
    this.oldContent = this.content.map((task) => ({ ...task }));
    this.content = this.content.map((task) => ({ ...task }));

    this.content.forEach((task) => {
      this.tasksBox.add_child(this.getTaskBox(task));
    });

    this.tasksBox.add_child(this.getNewTaskBox());

    // Add the color buttons
    this.setColorButtons();

    setTimeout(() => {
      this.newTaskEntry.grab_key_focus();
    }, 100);
  }

  createTasksBox() {
    const tasksBox = new St.BoxLayout({
      vertical: true,
      reactive: true,
      x_expand: true,
      y_expand: true,
      style: 'padding: 5px;',
      x_align: Clutter.ActorAlign.FILL,
      y_align: Clutter.ActorAlign.FILL
    });

    // Make the tasks box content scrollable
    const scrollView = new St.ScrollView({
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
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
    const taskBox = new St.BoxLayout({
      vertical: false,
      reactive: true,
      style: 'padding: 2px;'
    });

    const checkBox = new CheckBox.CheckBox('');
    checkBox.checked = task.isDone;

    checkBox.connect('clicked', () => {
      task.isDone = !task.isDone;
      this.update();
    });

    const taskEntry = new St.Entry({
      text: task.title,
      clip_to_allocation: true,
      reactive: true,
      style: 'font-size: 14px;color: #fff; padding: 2px 5px 1px;',
      x_expand: true
    });

    taskEntry.clutter_text.connect('text-changed', () => {
      task.title = taskEntry.get_text();
    });

    // On enter, remove the task if the title is empty
    taskEntry.clutter_text.connect('activate', () => {
      if (task.title === '') {
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
      title: '',
      isDone: false
    };

    const taskBox = new St.BoxLayout({
      vertical: false,
      reactive: true,
      style: 'padding: 2px;'
    });

    const taskEntry = new St.Entry({
      text: task.title,
      clip_to_allocation: true,
      reactive: true,
      style: 'font-size: 14px;color: #fff; padding: 2px 5px 1px;',
      x_expand: true
    });

    taskEntry.clutter_text.connect('text-changed', () => {
      task.title = taskEntry.get_text();
    });

    // On enter, add a new task if the title is not empty
    taskEntry.clutter_text.connect('activate', () => {
      if (task.title !== '') {
        this.content.push(task);
        this.update();
      }
    });

    taskBox.add_child(taskEntry);

    this.newTaskEntry = taskEntry;

    return taskBox;
  }
}
