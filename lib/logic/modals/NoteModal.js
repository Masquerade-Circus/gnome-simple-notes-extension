/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { COLORS, NOTE_MODAL } from '../constants';

import Store from '../../core/Store';

const { St, Clutter } = imports.gi;
const { modalDialog: ModalDialog } = imports.ui;

export class NoteModal {
  constructor({ id, onUpdate, isNew }) {
    const notes = Store.getState('notes') || [];
    const note = notes[id];

    if (!note) {
      throw new Error('Note not found');
    }

    this.title = note.title;
    this.type = note.type;
    this.content = note.content;
    this.color = note.color;
    this.onUpdate = onUpdate;
    this.id = id;
    this.isNew = isNew || false;
    this.oldContent = null;
    this.newContent = null;

    this.widget = null;

    this.createWidget();

    this.update();
  }

  constructBody() {
    throw new Error('Not implemented');
  }

  createWidget() {
    const widget = new ModalDialog.ModalDialog({});

    global.display.connect('workareas-changed', () => widget.queue_relayout());

    widget.setButtons([
      {
        label: 'Save',
        action: () => this.save(),
        key: Clutter.KEY_S
      },
      {
        label: 'Delete',
        action: () => this.delete()
      },
      {
        label: 'Close',
        action: () => this.close(),
        key: Clutter.KEY_Escape
      }
    ]);

    // Remove the padding of the contentLayout
    widget.contentLayout.style_class = 'note-content-layout';
    widget.contentLayout.style = `background-color: ${
      COLORS[this.color]
    };border-radius: 5px;`;
    widget.contentLayout.width = NOTE_MODAL.maxWidth;
    widget.contentLayout.height = NOTE_MODAL.maxHeight;

    this.widget = widget;
  }

  setTitle() {
    // Add the title
    const titleBox = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: 'background-color: rgba(0, 0, 0, 0.2);border-radius: 5px 5px 0 0;',
      x_align: Clutter.ActorAlign.FILL
    });

    const title = new St.Entry({
      text: this.title,
      clip_to_allocation: true,
      reactive: true,
      style:
        'font-weight: bold; font-size: 14px;color: #fff; padding: 5px; background-color: transparent; outline: none;border: none;',
      x_expand: true
    });

    title.clutter_text.connect('text-changed', () => {
      this.title = title.get_text();
    });

    titleBox.connect('button-press-event', () => {
      title.grab_key_focus();
    });

    titleBox.add_child(title);
    this.widget.contentLayout.add_child(titleBox);
  }

  setColorButtons() {
    const colorButtons = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 5px;',
      x_align: Clutter.ActorAlign.END
    });

    Object.keys(COLORS).forEach((colorName) => {
      const color = COLORS[colorName];
      let style = `background-color: ${color};border-radius: 5px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.5); margin: 0 5px;`;
      if (colorName === this.color) {
        style += 'border: 2px solid #fff;';
      }
      const button = new St.Button({
        style,
        width: 30,
        height: 30,
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER
      });

      button.connect('clicked', () => {
        this.color = colorName;
        this.widget.contentLayout.style = `background-color: ${color};border-radius: 5px;`;
        this.update();
      });

      colorButtons.add_child(button);
    });

    this.widget.contentLayout.add_child(colorButtons);
  }

  // Hides the note without destroying it
  hide() {
    this.widget.close();
  }

  // Shows the note
  show() {
    this.widget.open();
  }

  save() {
    if (this.newContent) {
      this.content = this.newContent;
    }

    let notes = Store.getState('notes');
    notes[this.id] = {
      title: this.title,
      type: this.type,
      content: this.content,
      color: this.color
    };
    Store.setState('notes', notes);
    this.isNew = false;

    this.hide();
    this.widget.destroy();
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }

  delete() {
    let notes = Store.getState('notes');
    notes.splice(this.id, 1);
    Store.setState('notes', notes);
    this.hide();
    this.widget.destroy();
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }

  close() {
    this.hide();
    if (this.isNew) {
      this.delete();
    } else {
      if (this.oldContent) {
        this.content = this.oldContent;
      }
    }
    this.widget.destroy();
  }

  update() {
    if (!this.widget) {
      throw new Error('Widget not created');
    }
    this.widget.contentLayout.destroy_all_children();

    this.constructBody();

    this.show();
  }
}
