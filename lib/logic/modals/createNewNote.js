/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { COLOR_TYPES, NOTE_TYPES } from '../constants';

import { ImageNoteModal } from './ImageNoteModal';
import Store from '../../core/Store';
import { TasksNoteModal } from './TasksNoteModal';
import { TextNoteModal } from './TextNoteModal';

export const createNewNote = ({ type, onUpdate }) => {
  let notes = Store.getState('notes');
  let id = notes.length; // note last index + 1

  const note = {
    title: 'New note',
    type,
    content: '',
    color: COLOR_TYPES.DEFAULT
  };
  notes.push(note);

  switch (type) {
    case NOTE_TYPES.TEXT:
      new TextNoteModal({ id, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.TASKS:
      note.title = 'New tasks';
      note.content = [];
      new TasksNoteModal({ id, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.IMAGE:
      new ImageNoteModal({ id, onUpdate, isNew: true });
      break;
    case NOTE_TYPES.WORKSPACE:
      note.title = 'Workspace switcher';
      note.content = 0;
      Store.setState('notes', notes);
      onUpdate();
      break;
  }
};
