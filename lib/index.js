/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

import Extension from './logic/Extension';
const id = 'org.gnome.shell.extensions.side-notes';

function init() {
  try {
    return new Extension(id);
  } catch (error) {
    logError(error);
  }
}
