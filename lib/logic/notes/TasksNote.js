/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';

const { St, Clutter } = imports.gi;

export class TasksNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });
  }

  constructBody() {
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
}
