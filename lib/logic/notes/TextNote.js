/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';

const { St } = imports.gi;

export class TextNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });
  }

  constructBody() {
    this.setTitle();

    const contentText = new St.Label({
      text: this.content,
      clip_to_allocation: true,
      reactive: true,
      style: 'padding: 5px;'
    });

    this.box.add_child(contentText);
  }
}
