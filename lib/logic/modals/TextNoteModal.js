/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { NoteModal } from './NoteModal';

const { St, Pango } = imports.gi;

export class TextNoteModal extends NoteModal {
  constructor({ id, onUpdate }) {
    super({ id, onUpdate });
  }

  constructBody() {
    // Add the title
    this.setTitle();

    const textArea = new St.BoxLayout({
      clip_to_allocation: true,
      vertical: true,
      reactive: true,
      style: 'padding: 5px;',
      x_expand: true,
      y_expand: true
    });

    this.widget.contentLayout.add_child(textArea);

    const text = new St.Entry({
      text: this.content,
      reactive: true,
      style:
        'font-size: 14px;color: #fff; padding: 5px; background-color: transparent; outline: none;border: none;',
      x_expand: true,
      y_expand: false
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

    // Add the color buttons
    this.setColorButtons();
  }
}
