/* eslint-disable gjs/no-js-class */
'use strict';

import { COLORS, COLOR_TYPES, NOTE_MODAL, NOTE_TYPES } from './constants';

import Store from '../core/Store';

const { St, Clutter, Pango } = imports.gi;
const { modalDialog: ModalDialog } = imports.ui;

class NoteModal {
  constructor({ id, onUpdate }) {
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
    this.isNew = false;

    this.widget = null;

    this.createWidget();

    this.constructType();
  }

  constructType() {
    if (this.widget) {
      this.widget.contentLayout.destroy_all_children();
    }

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

  // The widget is a ModalDialog that will be used as the content of the note
  // It will show an area of the widget, with scrollbars if needed that will be used to
  // see the contents of the note
  // At the bottom of the widget, there should be a button for every color in the config
  // And three buttons to save, delete and close the modal
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

    widget.open();
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

  setTextNote() {
    // Add the title
    this.setTitle();

    // Add the editable text area to the noteLayout
    const textArea = new St.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 5px;',
      x_align: Clutter.ActorAlign.FILL,
      y_align: Clutter.ActorAlign.FILL,
      x_expand: true,
      y_expand: true
    });

    const text = new St.Entry({
      text: this.content,
      clip_to_allocation: true,
      reactive: true,
      style:
        'font-size: 14px;color: #fff; padding: 5px; background-color: transparent; outline: none;border: none;',
      x_expand: true
    });

    let clutterText = text.clutter_text;
    clutterText.set_single_line_mode(false);
    clutterText.set_activatable(false);
    clutterText.set_line_wrap(true);
    clutterText.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);

    clutterText.connect('text-changed', () => {
      this.content = text.get_text();
    });

    textArea.add_child(text);

    textArea.connect('button-press-event', () => {
      text.grab_key_focus();
    });

    this.widget.contentLayout.add_child(textArea);

    // Add the color buttons
    this.setColorButtons();

    this.widget.open();
  }

  setTasksNote() {}

  setImageNote() {
    // Add the editable text area to the noteLayout
    let style = `background-size: contain;background-image: url("${this.content}");border-radius: 5px;`;
    const imageArea = new St.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      style,
      x_align: Clutter.ActorAlign.FILL,
      y_align: Clutter.ActorAlign.FILL,
      x_expand: true,
      y_expand: true
    });

    this.widget.contentLayout.add_child(imageArea);

    // Add an input to change the image
    // If the user clicks on this input it will open a file chooser

    this.widget.open();
  }

  save() {
    this.update();

    let notes = Store.getState('notes');
    notes[this.id] = {
      title: this.title,
      type: this.type,
      content: this.content,
      color: this.color
    };
    Store.setState('notes', notes);
    this.isNew = false;

    this.widget.close();
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }

  delete() {
    let notes = Store.getState('notes');
    notes.splice(this.id, 1);
    Store.setState('notes', notes);
    this.widget.close();
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }

  close() {
    this.widget.close();
    if (this.isNew) {
      this.delete();
    }
    this.widget.destroy();
  }

  update() {
    this.constructType();
  }
}

export const createNewNote = ({ type, onUpdate }) => {
  let notes = Store.getState('notes');
  let id = notes.length; // note last index + 1

  notes.push({
    title: 'New note',
    type,
    content: '',
    color: COLOR_TYPES.DEFAULT
  });

  let noteModal = new NoteModal({
    id,
    onUpdate
  });

  noteModal.isNew = true;
};

export default NoteModal;
