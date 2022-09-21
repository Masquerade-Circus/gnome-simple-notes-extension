/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { Note } from './Note';

const { Clutter } = imports.gi;
const { main: Main } = imports.ui;
const { WorkspaceThumbnail } = imports.ui.workspaceThumbnail;
const workspaceManager = global.workspace_manager;

export class WorkspaceNote extends Note {
  constructor({ id, width, height, onUpdate }) {
    super({ id, width, height, onUpdate });

    this.addListeners();
  }

  addListeners() {
    this.bindedRebuild = this.rebuild.bind(this);
    this.bindedRemoveDraggableFromWindows =
      this.removeDraggableFromWindows.bind(this);
    global.display.connect(
      'window-entered-monitor',
      this.bindedRemoveDraggableFromWindows
    );

    global.display.connect('workareas-changed', this.bindedRebuild);
    Main.layoutManager.connect('monitors-changed', this.bindedRebuild);
    // Listen when a window change its focus to update the thumbnail
    global.display.connect('notify::focus-window', this.bindedRebuild);
  }

  // Show a selected workspace thumbnail in the note
  // When the note is clicked, show the next workspace
  constructBody() {
    const workspace = workspaceManager.get_workspace_by_index(this.content);
    const workspaceThumbnail = new WorkspaceThumbnail(workspace, 0);
    this.workspaceThumbnail = workspaceThumbnail;
    workspaceThumbnail.set_size(this.width, this.height);
    workspaceThumbnail.show();
    const scale = this.width / global.screen_width;
    workspaceThumbnail.setScale(scale, scale);
    workspaceThumbnail.style = 'border-radius: 5px;background: #000000;';

    // Remove the draggable effect from the thumbnail
    this.removeDraggableFromWindows();

    // Listen for shift + scroll to change the workspace
    this.box.connect('scroll-event', (actor, event) => {
      const direction = event.get_scroll_direction();
      if (direction === Clutter.ScrollDirection.UP) {
        this.content++;
        if (this.content >= workspaceManager.n_workspaces) {
          this.content = 0;
        }
        this.rebuild();
      } else if (direction === Clutter.ScrollDirection.DOWN) {
        this.content--;
        if (this.content < 0) {
          this.content = workspaceManager.n_workspaces - 1;
        }
        this.rebuild();
      }
      return Clutter.EVENT_STOP;
    });

    this.box.add(workspaceThumbnail);
  }

  removeDraggableFromWindows() {
    if (this.workspaceThumbnail) {
      this.workspaceThumbnail._windows.forEach((child) => {
        // Hackish way to know if the window is a clone and
        // remove the draggable effect from it if it is
        if (child.realWindow && child._draggable) {
          child.set_reactive(false);
        }
      });
    }
  }

  destroy() {
    // Remove listeners
    global.display.disconnect(
      'window-entered-monitor',
      this.bindedRemoveDraggableFromWindows
    );
    global.display.disconnect('workareas-changed', this.bindedRebuild);
    Main.layoutManager.disconnect('monitors-changed', this.bindedRebuild);
    global.display.disconnect('notify::focus-window', this.bindedRebuild);

    super.destroy();
  }
}
