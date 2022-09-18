/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

import Dev from './core/DevExtension';
import Extension from './logic/Extension';

const isDev = true;
const id = 'org.gnome.shell.extensions.side-notes';

function init() {
  try {
    if (isDev) {
      return new Dev(id);
    }

    return new Extension(id);
  } catch (error) {
    let stack = error.stack
      .split('\n')
      .map((line) => line.replace(/^\.*masquerade-circus.net\//, ''));
    error.stack = stack.join('\n');
    logError(error);
  }
}
