/* eslint-disable no-underscore-dangle */
/* eslint-disable gjs/no-super */
/* eslint-disable gjs/no-js-class */
/* eslint-disable no-unused-vars */
'use strict';

import Store, { LOG_LEVELS } from './Store';

const getDevProxyInstance = (instance) => {
  return new Proxy(instance, {
    get: (target, prop) => {
      if (prop === 'enable') {
        global.context.unsafe_mode = true;
        Store.logLevel = LOG_LEVELS.DEBUG;
        return target[prop];
      }

      if (prop === 'disable') {
        global.context.unsafe_mode = false;
        return target[prop];
      }

      if (prop in target) {
        return target[prop];
      }
    }
  });
};

export default getDevProxyInstance;
