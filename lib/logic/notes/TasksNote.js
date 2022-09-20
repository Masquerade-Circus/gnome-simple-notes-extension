/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';
import Store from '../../core/Store';

const { St, Clutter } = imports.gi;
const { checkBox: CheckBox } = imports.ui;

export class TasksNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });
  }

  constructBody() {
    let doneTasksCount = this.content.reduce(
      (acc, task) => (task.isDone ? (acc += 1) : acc),
      0
    );

    this.setTitle(`(${doneTasksCount}/${this.content.length})`);

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

    this.content.forEach((task, i) => {
      Store.log(i, task);
      tasksBox.add_child(this.getTaskBox({ task, onClick: this.onUpdate }));
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

  getTaskBox({ task, onClick }) {
    const taskBox = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 2px;'
    });

    const taskCheckBox = new CheckBox.CheckBox(task.title);

    taskCheckBox.checked = task.isDone;

    taskCheckBox.connect('clicked', () => {
      let idx = this.content.findIndex((t) => t === task);
      if (idx !== -1) {
        this.content[idx].isDone = !task.isDone;
      }
      if (typeof onClick === 'function') {
        onClick();
      }
    });

    taskBox.add_child(taskCheckBox);

    return taskBox;
  }
}
