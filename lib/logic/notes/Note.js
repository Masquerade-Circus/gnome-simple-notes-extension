/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { COLORS, NOTE_TYPES } from '../constants';

import { ImageNoteModal } from '../modals/ImageNoteModal';
import Store from '../../core/Store';
import { TasksNoteModal } from '../modals/TasksNoteModal';
import { TextNoteModal } from '../modals/TextNoteModal';

const { St } = imports.gi;

export class Note {
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

    this.id = id;
    this.title = note.title;
    this.type = note.type;
    this.content = note.content;
    this.color = note.color;
    this.width = width;
    this.height = height;
    this.onUpdate = onUpdate;

    this.constructBody();
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

  constructBody() {
    throw new Error('Method not implemented');
  }

  update() {
    if (typeof this.onUpdate === 'function' && this.onUpdate() === false) {
      return;
    }

    // Remove all children from the box and re-create the note
    this.box.destroy_all_children();
    this.constructBody();
  }
}