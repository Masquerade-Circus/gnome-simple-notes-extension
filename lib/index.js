/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

const { default: Dev } = require('./DevExtension');
const { default: Extension } = require('./Extension');

const isDev = true;
const id = 'org.gnome.shell.extensions.side-notes';

function init() {
  try {
    if (isDev) {
      return new Dev(id);
    }

    return new Extension(id);
  } catch (error) {
    logError(error);
  }
}
