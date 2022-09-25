/* eslint-disable gjs/no-spread */
/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import {
  DEFAULT_NOTES,
  DEFAULT_NOTES_CONFIG,
  NOTE_TYPES,
  POSITION_TYPES,
  SIZES
} from './constants';

import BaseExtension from '../core/BaseExtension';
import { ImageNote } from './notes/ImageNote';
import Store from '../core/Store';
import { TasksNote } from './notes/TasksNote';
import { TextNote } from './notes/TextNote';
import { WorkspaceNote } from './notes/WorkspaceNote';
import { createNewNote } from './modals/createNewNote';

const { main: Main, ctrlAltTab: CtrlAltTab, popupMenu: PopupMenu } = imports.ui;
const { St, Clutter } = imports.gi;

class Extension extends BaseExtension {
  constructor(id) {
    super(id);
    // The widget panel
    this.widget = null;

    // Panel buttons
    this.addNoteButton = null;
    this.showNotesButton = null;

    // Objects for logic
    this.notesBox = null;
    this.scrollView = null;
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

    if (this.configButton) {
      this.configButton.destroy();
    }
  }

  initConfigAndState() {
    let isHidden = Store.getConfig('isHidden');
    if (typeof isHidden !== 'boolean') {
      Store.setConfig('isHidden', false);
    }

    let width = Store.getConfig('width');
    if (!width) {
      Store.setConfig('width', DEFAULT_NOTES_CONFIG.width);
    }

    let height = Store.getConfig('height');
    if (!height) {
      Store.setConfig('height', DEFAULT_NOTES_CONFIG.height);
    }

    let position = Store.getConfig('position');
    if (!position) {
      Store.setConfig('position', DEFAULT_NOTES_CONFIG.position);
    }

    let notes = Store.getState('notes');
    if (!notes) {
      Store.setState('notes', DEFAULT_NOTES);
    }
  }

  initPanelButtons() {
    this.initConfigPanelButton();
    this.initAddNotePanelButton();
    this.initShowNotesPanelButton();
  }

  initAddNotePanelButton() {
    const addNoteButton = this.addPanelButton({
      role: 'Add note',
      dontCreateMenu: false
    });
    addNoteButton.setLabel('+');

    addNoteButton.menu.addAction('Text', () => this.addNote(NOTE_TYPES.TEXT));
    addNoteButton.menu.addAction('Image', () => this.addNote(NOTE_TYPES.IMAGE));
    addNoteButton.menu.addAction('Tasks', () => this.addNote(NOTE_TYPES.TASKS));
    addNoteButton.menu.addAction('Workspace', () =>
      this.addNote(NOTE_TYPES.WORKSPACE)
    );

    this.addNoteButton = addNoteButton;
  }

  initShowNotesPanelButton() {
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

  initConfigPanelButton() {
    const configButton =
      this.configButton ||
      this.addPanelButton({
        role: 'Config',
        dontCreateMenu: false
      });
    configButton.setLabel('⚙');

    // Remove children from the menu
    configButton.menu.removeAll();

    configButton.menu.addMenuItem(
      new PopupMenu.PopupSeparatorMenuItem('Position')
    );

    configButton.menu.addAction('Top', () =>
      this.setPosition(POSITION_TYPES.TOP)
    );
    configButton.menu.addAction('Left', () =>
      this.setPosition(POSITION_TYPES.LEFT)
    );
    configButton.menu.addAction('Right', () =>
      this.setPosition(POSITION_TYPES.RIGHT)
    );

    configButton.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem('Size'));

    Object.values(SIZES).forEach(({ width, height, label }) => {
      let isActive = width === Store.getConfig('width');
      configButton.menu.addAction(
        `${label} (${width}x${height}) ${isActive ? '✓' : ''}`,
        () => {
          Store.setConfig('width', width);
          Store.setConfig('height', height);
          this.initConfigPanelButton();
          this.showNotes();
        }
      );
    });

    this.configButton = configButton;
  }

  initWidget() {
    // Create a new St.Widget
    this.widget = new St.Widget({
      width: global.screen_width,
      height: 100,
      reactive: true
    });

    // Prevent maximized windows from drawing over the widget
    this.widget.set_offscreen_redirect(Clutter.OffscreenRedirect.ALWAYS);

    // Add the widget to the screen
    Main.ctrlAltTabManager.addGroup(
      this.widget,
      'Simple Notes',
      'focus-top-bar-symbolic',
      { sortGroup: CtrlAltTab.SortGroup.TOP }
    );
    global.display.connect('workareas-changed', () => this.setPositions());
    Main.layoutManager.connect('monitors-changed', () => this.setPositions());
    this.widget.connect('destroy', () => {
      Main.layoutManager.removeChrome(this.widget);
    });
  }

  initNotesBox() {
    // Create a box that will contain all the notes
    this.notesBox = new St.BoxLayout({
      vertical: false,
      reactive: true
    });

    // Make the tasks box content scrollable
    const scrollView = new St.ScrollView({
      hscrollbar_policy: St.PolicyType.AUTOMATIC,
      vscrollbar_policy: St.PolicyType.NEVER,
      overlay_scrollbars: true,
      reactive: true
    });

    scrollView.add_actor(this.notesBox);
    this.scrollView = scrollView;

    this.widget.add_child(this.scrollView);

    this.showNotes();
  }

  setPosition(position) {
    let oldPosition = Store.getConfig('position');

    if (oldPosition === POSITION_TYPES.TOP) {
      Main.layoutManager.panelBox.remove_child(this.widget);
    } else {
      Main.layoutManager.removeChrome(this.widget);
    }

    if (position === POSITION_TYPES.TOP) {
      Main.layoutManager.panelBox.add_child(this.widget);
    } else {
      Main.layoutManager.addChrome(this.widget, {
        affectsStruts: true,
        trackFullscreen: true,
        affectsInputRegion: true
      });
    }

    Store.setConfig('position', position);
    this.setPositions();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  setPositions() {
    let position = Store.getConfig('position');
    let shouldBeHidden = Store.getConfig('isHidden');

    if (position === POSITION_TYPES.TOP) {
      Main.layoutManager.panelBox.remove_child(this.widget);
    } else {
      Main.layoutManager.removeChrome(this.widget);
    }

    if (shouldBeHidden) {
      this.widget.hide();
      return;
    }

    let { notesWidth, notesHeight } = this.getNotesWidthAndHeight();

    const vertical = position !== POSITION_TYPES.TOP;
    const widgetWidth = vertical ? notesWidth + 20 : global.screen_width;
    const widgetHeight = vertical
      ? global.screen_height - Main.layoutManager.panelBox.height - 20
      : notesHeight + 20;
    const x =
      position === POSITION_TYPES.RIGHT ? global.screen_width - widgetWidth : 0;
    const y = Main.layoutManager.panelBox.height;

    this.widget.width = widgetWidth;
    this.widget.height = widgetHeight;
    this.widget.vertical = vertical;
    this.widget.x = x;
    this.widget.y = y;

    this.notesBox.vertical = vertical;

    this.scrollView.width = widgetWidth;
    this.scrollView.height = widgetHeight;
    this.scrollView.hscrollbar_policy = vertical
      ? St.PolicyType.NEVER
      : St.PolicyType.AUTOMATIC;
    this.scrollView.vscrollbar_policy = vertical
      ? St.PolicyType.AUTOMATIC
      : St.PolicyType.NEVER;

    // Add the widget to the screen and prevent maximized windows from drawing over it
    if (position === POSITION_TYPES.TOP) {
      Main.layoutManager.panelBox.add_child(this.widget);
    } else {
      Main.layoutManager.addChrome(this.widget, {
        affectsStruts: true,
        affectsInputRegion: true,
        trackFullscreen: true
      });
    }

    this.widget.show();
  }

  showNotes() {
    // Remove all the notes from the notes box
    this.notesBox.destroy_all_children();

    this.setPositions();

    let notes = Store.getState('notes');
    let { notesWidth, notesHeight } = this.getNotesWidthAndHeight();

    this.widget.set_height(notesHeight + 10);
    this.widget.queue_relayout();

    notes.forEach((note, id) => {
      let options = {
        id,
        width: notesWidth,
        height: notesHeight,
        onUpdate: () => {
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
        case NOTE_TYPES.WORKSPACE:
          instance = new WorkspaceNote(options);
          break;

        // TODO: Add multiple clocks note type
        // TODO: Add command runner note type
      }

      if (!instance) {
        throw new Error(`Invalid note type: ${note.type}`);
      }

      this.notesBox.add_child(instance.box);
    });
  }

  getNotesWidthAndHeight() {
    let notesWidth = Store.getConfig('width');
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
        this.showNotes();
        return false;
      }
    });
  }
}

export default Extension;
