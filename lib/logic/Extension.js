/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import BaseExtension from '../core/BaseExtension';
import Note from './Note';
import Store from '../core/Store';
const { main: Main, ctrlAltTab: CtrlAltTab } = imports.ui;
const { St, Clutter } = imports.gi;

/*
    A note is an object with the following properties:
    {
      title: string,
      type: string (text, tasks, image, video),
      content: string | tasks array,
      color: string (primary | default | success | info | warning)
    }

    A task is an object with the following properties:
    {
      title: string,
      status: string (todo | doing | done)
      isDone: boolean
    }
  */

const defaultNotes = [
  // Text note
  {
    title: 'Note 1',
    type: 'text',
    content: 'This is a text note',
    color: 'primary'
  },
  // Tasks note
  {
    title: 'Note 2',
    type: 'tasks',
    content: [
      {
        title: 'Task 1',
        status: 'todo',
        isDone: false
      },
      {
        title: 'Task 2',
        status: 'doing',
        isDone: false
      },
      {
        title: 'Task 3',
        status: 'done',
        isDone: true
      }
    ],
    color: 'default'
  },
  // Image note
  {
    title: 'Note 3',
    type: 'image',
    content: 'https://picsum.photos/200/300',
    color: 'success'
  }
];

const defaultNotesConfig = {
  maxWidth: 300,
  items: 5,
  height: 100,
  colors: {
    primary: '#3244ad',
    accent: '#953ca5',
    success: '#2ab7a9',
    info: '#00c3e0',
    warning: '#bf7921',
    danger: '#bb2626',
    default: '#646c8a'
  }
};

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
      Store.setConfig('notes', defaultNotesConfig);
    }

    let notes = Store.getState('notes');
    if (notes) {
      Store.setState('notes', defaultNotes);
    }
  }

  initPanelButton() {
    this.panelButton.setLabels({ on: 'Hide notes', off: 'Show notes' });
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
    let notesConfig = Store.getConfig('notes');

    let notesWidth = Math.abs(global.screen_width / notesConfig.items);
    if (notesWidth > notesConfig.maxWidth) {
      notesWidth = notesConfig.maxWidth;
    }

    let notesHeight = (notesWidth * 16) / 9;

    let maxNotes = Math.abs(global.screen_width / notesWidth);

    // Remove all the notes from the notes box
    this.notesBox.destroy_all_children();

    for (let i = 0; i < maxNotes; i++) {
      let note = notes[i];
      if (!note) {
        break;
      }

      let instance = new Note({
        id: i,
        color: notesConfig.colors[note.color],
        width: notesWidth,
        height: notesHeight
      });

      this.notesBox.add_child(instance.box);
    }
  }
}

export default Extension;
