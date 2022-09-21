/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
'use strict';

import { NoteModal } from './NoteModal';

const { WorkspaceThumbnail } = imports.ui.workspaceThumbnail;
const workspaceManager = global.workspace_manager;

export class WorkspaceNoteModal extends NoteModal {
  constructor({ id, onUpdate }) {
    super({ id, onUpdate, buttons: { save: false } });
  }

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

    this.widget.contentLayout.add(workspaceThumbnail);
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
}
