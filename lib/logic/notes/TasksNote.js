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
    let taskBoxHeight = this.height - 25;
    let maxItems = Math.trunc(taskBoxHeight / 20);
    let items = 0;
    let undoneTasks = this.content.filter((task) => !task.isDone);
    let doneTasks = this.content.filter((task) => task.isDone);
    let sortedTasks = undoneTasks.concat(doneTasks);

    this.setTitle(`(${doneTasks.length}/${this.content.length})`);

    const tasksBox = new St.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 5px;'
    });

    this.box.add_child(tasksBox);

    // Crete a task box for each task and add them a switch button to mark them as done
    for (let i = 0; i < sortedTasks.length; i++) {
      if (items === maxItems) {
        break;
      }

      const task = sortedTasks[i];

      let taskBox = this.getTaskBox({
        task,
        onClick: () => {
          this.update();
        }
      });
      taskBox.idx = i;

      tasksBox.add_child(taskBox);

      items += 1;
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
