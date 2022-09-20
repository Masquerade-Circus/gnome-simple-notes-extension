/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';

const { St } = imports.gi;

export class ImageNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });
  }

  constructBody() {
    const imageBox = new St.BoxLayout({
      clip_to_allocation: true,
      reactive: true,
      can_focus: true,
      style: `background-size: cover;background-image: url("${this.content}");border-radius: 5px;`,
      x_expand: true,
      y_expand: true
    });

    this.box.add_child(imageBox);
  }
}
