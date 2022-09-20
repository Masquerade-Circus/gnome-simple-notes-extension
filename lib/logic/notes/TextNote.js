/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';

const { St, Pango, Clutter } = imports.gi;

export class TextNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });
  }

  constructBody() {
    this.setTitle();

    const textArea = new St.BoxLayout({
      clip_to_allocation: true,
      vertical: true,
      reactive: true,
      style: 'padding: 5px;',
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
      this.save({
        reload: false
      });
    });

    textArea.add_child(text);

    textArea.connect('button-press-event', () => {
      text.grab_key_focus();
      return Clutter.EVENT_STOP;
    });

    this.box.add_child(textArea);
  }
}
