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
    this.panelButton.setLabels({ on: 'Show notes', off: 'Hide notes' });
    this.panelButton.setToggleState(Store.getConfig('isHidden'));
    this.panelButton.connect('button-press-event', () => {
      let isHidden = !Store.getConfig('isHidden');
      Store.setConfig('isHidden', isHidden);
      this.panelButton.setToggleState(isHidden);
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

    this.widget.set_height(notesHeight);

    let maxNotes = Math.abs(global.screen_width / notesWidth) - 1;

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

    this.showConfigButtons();
  }

  // Show a config box at the right of the notes box
  // with three buttons
  // - Add note with a plus icon
  // - Config notes with a cog icon
  // - List notes with a list icon
  showConfigButtons() {
    let { notesHeight } = this.getWidthAndHeight();

    let configBox = new St.BoxLayout({
      vertical: true,
      clip_to_allocation: true,
      reactive: true,
      y_expand: true
    });

    let addNoteButton = new St.Button({
      clip_to_allocation: true,
      style_class: 'simple-notes-config-button',
      width: 30,
      height: notesHeight / 3,
      reactive: true
    });

    let addNoteIcon = new St.Icon({
      clip_to_allocation: true,
      icon_name: 'list-add-symbolic',
      icon_size: 15,
      style_class: 'simple-notes-config-icon'
    });

    addNoteButton.add_child(addNoteIcon);

    addNoteButton.connect('button-press-event', () => {
      this.showAddNoteModal();
    });

    configBox.add_child(addNoteButton);

    let configNotesButton = new St.Button({
      clip_to_allocation: true,
      style_class: 'simple-notes-config-button',
      width: 30,
      height: notesHeight / 3,
      reactive: true
    });

    let configNotesIcon = new St.Icon({
      clip_to_allocation: true,
      icon_name: 'preferences-system-symbolic',
      icon_size: 15,
      style_class: 'simple-notes-config-icon'
    });

    configNotesButton.add_child(configNotesIcon);

    configNotesButton.connect('button-press-event', () => {
      this.showConfigNotesModal();
    });

    configBox.add_child(configNotesButton);

    let listNotesButton = new St.Button({
      clip_to_allocation: true,
      style_class: 'simple-notes-config-button',
      width: 30,
      height: notesHeight / 3,
      reactive: true
    });

    let listNotesIcon = new St.Icon({
      clip_to_allocation: true,
      icon_name: 'view-list-symbolic',
      icon_size: 15,
      style_class: 'simple-notes-config-icon'
    });

    listNotesButton.add_child(listNotesIcon);

    listNotesButton.connect('button-press-event', () => {
      this.showListNotesModal();
    });

    configBox.add_child(listNotesButton);

    Store.log('Config box added');

    this.notesBox.add_child(configBox);
  }

  getWidthAndHeight() {
    let notesConfig = Store.getConfig('notes');

    let notesWidth = Math.abs(global.screen_width / notesConfig.items);
    if (notesWidth > notesConfig.maxWidth) {
      notesWidth = notesConfig.maxWidth;
    }

    let notesHeight = (notesWidth / 16) * 9;

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
