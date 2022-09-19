/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import {
  COLORS,
  COLOR_TYPES,
  DEFAULT_NOTES,
  DEFAULT_NOTES_CONFIG
} from './constants';

import BaseExtension from '../core/BaseExtension';
import Note from './Note';
import Store from '../core/Store';

const {
  main: Main,
  ctrlAltTab: CtrlAltTab,
  modalDialog: ModalDialog
} = imports.ui;
const { St, Clutter } = imports.gi;

class Extension extends BaseExtension {
  constructor(id) {
    super(id);
    this.widget = null;
  }

  enable() {
    super.enable();

    // Inits the config and state of the extension
    this.initConfigAndState();

    // Inits the panel button behavior to toggle the notes box
    this.initPanelButton();

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

    // init the notes box
    this.initNotesBox();
  }

  disable() {
    if (this.widget) {
      this.widget.destroy();
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

  initPanelButton() {
    // TODO: Add a state to the panel button to show notes on button hover
    this.panelButton.setStates([
      {
        state: true,
        label: 'Show notes'
      },
      {
        state: false,
        label: 'Hide notes'
      }
    ]);
    this.panelButton.setState(Store.getConfig('isHidden'));
    this.panelButton.connect('button-press-event', () => {
      let isHidden = !Store.getConfig('isHidden');
      Store.setConfig('isHidden', isHidden);
      this.panelButton.setState(isHidden);
      this.showNotes();
    });
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

    let maxNotes = Math.abs(global.screen_width / notesWidth) - 1;
    maxNotes = 0;

    for (let i = 0; i < maxNotes; i++) {
      let note = notes[i];
      if (!note) {
        break;
      }

      let instance = new Note({
        id: i,
        width: notesWidth,
        height: notesHeight,
        onUpdate: () => {
          Store.logInfo('Note updated');
          this.showNotes();
          return false;
        }
      });

      this.notesBox.add_child(instance.box);
    }
  }

  getWidthAndHeight() {
    let notesConfig = Store.getConfig('notes');

    let notesWidth = Math.abs(global.screen_width / notesConfig.items);
    if (notesWidth > notesConfig.maxWidth) {
      notesWidth = notesConfig.maxWidth;
    }

    let notesHeight = Math.abs((notesWidth / 16) * 9);

    return { notesWidth, notesHeight };
  }

  // Show a modal asking for the type of note to add
  showAddNoteModal() {
    const modal = new ModalDialog.ModalDialog({});

    // Set the title to Select note type
    let title = new St.Label({
      text: 'Select note type',
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
      x_expand: true
    });

    modal.contentLayout.add_child(title);

    modal.setButtons([
      {
        label: 'Text',
        action: () => {
          modal.close();
          this.showAddTextNoteModal();
        }
      },
      {
        label: 'Image',
        action: () => {
          modal.close();
          this.showAddImageNoteModal();
        }
      },
      {
        label: 'Tasks',
        action: () => {
          modal.close();
          this.showAddTasksNoteModal();
        }
      },
      {
        label: 'Cancel',
        action: () => {
          modal.close();
        }
      }
    ]);

    modal.open();
  }
}

export default Extension;
