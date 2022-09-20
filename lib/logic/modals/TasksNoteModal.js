/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { NoteModal } from './NoteModal';

export class TasksNoteModal extends NoteModal {
  constructor({ id, onUpdate }) {
    super({ id, onUpdate });
  }

  constructBody() {}
}
