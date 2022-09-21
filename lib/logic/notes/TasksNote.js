/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';

const { St, Clutter } = imports.gi;
const { checkBox: CheckBox } = imports.ui;

export class TasksNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });
  }

  constructBody() {
    this.updateTitle();

    const tasksBox = new St.BoxLayout({
      vertical: true,
      reactive: true,
      style: 'padding: 5px;'
    });

    // Make the tasks box scrollable
    const scrollView = new St.ScrollView({
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
      overlay_scrollbars: true,
      reactive: true
    });

    scrollView.add_actor(tasksBox);

    this.content.forEach((task) => {
      tasksBox.add_child(this.getTaskBox(task));
    });

    // If there are no undone tasks, show a message
    if (this.content.length === 0) {
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

    this.box.add_child(scrollView);
  }

  updateTitle() {
    let doneTasksCount = this.content.reduce(
      (acc, task) => (task.isDone ? (acc += 1) : acc),
      0
    );

    this.setTitle(`(${doneTasksCount}/${this.content.length})`);
  }

  getTaskBox(task) {
    const taskBox = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 2px;'
    });

    const taskCheckBox = new CheckBox.CheckBox(task.title);

    taskCheckBox.checked = task.isDone;

    taskCheckBox.connect('clicked', () => {
      task.isDone = !task.isDone;
      this.save({ reload: false });
      this.updateTitle();
    });

    taskBox.add_child(taskCheckBox);

    return taskBox;
  }
}
