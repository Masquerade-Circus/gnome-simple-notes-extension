/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { DEFAULT_NOTES, DEFAULT_NOTES_CONFIG, NOTE_TYPES } from './constants';

import BaseExtension from '../core/BaseExtension';
import { ImageNote } from './notes/ImageNote';
import Store from '../core/Store';
import { TasksNote } from './notes/TasksNote';
import { TextNote } from './notes/TextNote';
import { createNewNote } from './modals/createNewNote';

const { main: Main, ctrlAltTab: CtrlAltTab } = imports.ui;
const { St, Clutter } = imports.gi;

class Extension extends BaseExtension {
  constructor(id) {
    super(id);
    this.widget = null;
    this.addNoteButton = null;
    this.showNotesButton = null;
  }

  enable() {
    super.enable();

    // Inits the config and state of the extension
    this.initConfigAndState();

    // Inits the panel buttons
    this.initPanelButtons();

    // Init the widget panel
    this.initWidget();

    // init the notes box
    this.initNotesBox();
  }

  disable() {
    super.disable();
    if (this.widget) {
      this.widget.destroy();
    }

    if (this.showNotesButton) {
      this.showNotesButton.destroy();
    }

    if (this.addNoteButton) {
      this.addNoteButton.destroy();
    }
  }

  initConfigAndState() {
    let isHidden = Store.getConfig('isHidden');
    if (isHidden === undefined || isHidden === null) {
      Store.setConfig('isHidden', false);
    }

    let notesConfig = Store.getConfig('notes');
    if (!notesConfig) {
      Store.setConfig('notes', DEFAULT_NOTES_CONFIG);
    }

    let notes = Store.getState('notes');
    if (notes) {
      Store.setState('notes', DEFAULT_NOTES);
    }
  }

  initPanelButtons() {
    // Add note button
    const addNoteButton = this.addPanelButton({
      role: 'Add note',
      dontCreateMenu: false
    });
    addNoteButton.setLabel('+');

    addNoteButton.menu.addAction('Text', () => this.addNote(NOTE_TYPES.TEXT));
    addNoteButton.menu.addAction('Image', () => this.addNote(NOTE_TYPES.IMAGE));
    addNoteButton.menu.addAction('Tasks', () => this.addNote(NOTE_TYPES.TASKS));

    this.addNoteButton = addNoteButton;

    // TODO: Add a state to the panel button to show notes on button hover
    const showNotesButton = this.addPanelButton({ role: 'Indicator' });
    showNotesButton.setStates([
      {
        state: true,
        label: '▼'
      },
      {
        state: false,
        label: '▲'
      }
    ]);
    showNotesButton.setState(Store.getConfig('isHidden'));
    showNotesButton.connect('button-press-event', () => {
      let isHidden = !Store.getConfig('isHidden');
      Store.setConfig('isHidden', isHidden);
      showNotesButton.setState(isHidden);
      this.showNotes();
    });
    this.showNotesButton = showNotesButton;
  }

  initWidget() {
    // Create a new St.Widget
    this.widget = new St.Widget({
      width: global.screen_width,
      height: 100,
      clip_to_allocation: true,
      reactive: true
    });

    // Prevent maximized windows from drawing over the widget
    this.widget.set_offscreen_redirect(Clutter.OffscreenRedirect.ALWAYS);

    // Add the widget to the top of the screen
    Main.layoutManager.panelBox.add(this.widget);
    Main.ctrlAltTabManager.addGroup(
      this.widget,
      'Simple Notes',
      'focus-top-bar-symbolic',
      { sortGroup: CtrlAltTab.SortGroup.TOP }
    );
    global.display.connect('workareas-changed', () =>
      this.widget.queue_relayout()
    );
  }

  initNotesBox() {
    // Create a box that will contain all the notes
    this.notesBox = new St.BoxLayout({
      vertical: false,
      width: global.screen_width,
      clip_to_allocation: true,
      reactive: true
    });

    // Add the notes box to the widget
    this.widget.add_child(this.notesBox);

    this.showNotes();
  }

  showNotes() {
    // Remove all the notes from the notes box
    this.notesBox.destroy_all_children();

    let shouldBeHidden = Store.getConfig('isHidden');

    if (shouldBeHidden) {
      // Hide the widget if it's not hidden
      if (this.widget.visible) {
        this.widget.hide();
      }
      return;
    }

    // Show the widget if it's hidden
    if (!this.widget.visible) {
      this.widget.show();
    }

    let notes = Store.getState('notes');
    let { notesWidth, notesHeight } = this.getWidthAndHeight();

    if (this.widget.height !== notesHeight) {
      this.widget.set_height(notesHeight);
      this.widget.queue_relayout();
    }

    let maxNotes = Math.trunc(global.screen_width / notesWidth) - 1;

    for (let i = 0; i < maxNotes; i++) {
      let note = notes[i];
      if (!note) {
        break;
      }

      let options = {
        id: i,
        width: notesWidth,
        height: notesHeight,
        onUpdate: () => {
          Store.logInfo('Note updated');
          this.showNotes();
          return false;
        }
      };

      let instance = null;

      switch (note.type) {
        case NOTE_TYPES.TEXT:
          instance = new TextNote(options);
          break;
        case NOTE_TYPES.IMAGE:
          instance = new ImageNote(options);
          break;
        case NOTE_TYPES.TASKS:
          instance = new TasksNote(options);
          break;
      }

      if (!instance) {
        throw new Error(`Invalid note type: ${note.type}`);
      }

      this.notesBox.add_child(instance.box);
    }
  }

  getWidthAndHeight() {
    let notesConfig = Store.getConfig('notes');

    let notesWidth = Math.trunc(global.screen_width / notesConfig.items);
    if (notesWidth > notesConfig.maxWidth) {
      notesWidth = notesConfig.maxWidth;
    }

    let notesHeight = Math.trunc((notesWidth / 16) * 9);

    return { notesWidth, notesHeight };
  }

  addNote(type) {
    if (!type) {
      return;
    }

    if (Object.values(NOTE_TYPES).indexOf(type) === -1) {
      throw new Error(`Invalid note type: ${type}`);
    }

    createNewNote({
      type,
      onUpdate: () => {
        Store.logInfo('Note updated');
        this.showNotes();
        return false;
      }
    });
  }
}

export default Extension;
