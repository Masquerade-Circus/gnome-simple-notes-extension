/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { NoteModal } from './NoteModal';

const { St, Clutter } = imports.gi;

export class ImageNoteModal extends NoteModal {
  constructor({ id, onUpdate }) {
    super({ id, onUpdate });
  }

  constructBody() {
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
    const imageInput = new St.Entry({
      clip_to_allocation: true,
      reactive: true,
      style: 'font-size: 14px;color: #fff; padding: 5px;',
      x_expand: true,
      text: this.content
    });

    this.newContent = null;

    imageInput.clutter_text.connect('text-changed', () => {
      this.newContent = imageInput.get_text();
    });

    this.widget.contentLayout.add_child(imageInput);
  }
}
