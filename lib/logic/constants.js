export const NOTE_TYPES = {
  TEXT: 'text',
  TASKS: 'tasks',
  IMAGE: 'image'
};

export const NOTE_MODAL = {
  maxWidth: 640,
  maxHeight: Math.trunc((640 / 16) * 9)
};

export const COLOR_TYPES = {
  PRIMARY: 'primary',
  ACCENT: 'accent',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
  DEFAULT: 'default'
};

export const COLORS = {
  primary: '#3244ad',
  accent: '#953ca5',
  success: '#2ab7a9',
  info: '#00c3e0',
  warning: '#bf7921',
  danger: '#bb2626',
  default: '#646c8a'
};

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
    isDone: boolean
  }
*/

export const DEFAULT_NOTES = [
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
        isDone: true
      },
      {
        title: 'Task 2',
        isDone: false
      },
      {
        title: 'Task 3',
        isDone: true
      },
      {
        title: 'Task 4',
        isDone: false
      },
      {
        title: 'Task 5',
        isDone: false
      }
    ],
    color: 'default'
  },
  // Image note
  {
    title: 'Note 3',
    type: 'image',
    content: 'https://picsum.photos/320/180',
    color: 'success'
  }
];

export const POSITION_TYPES = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right'
};

export const SIZES = {
  SMALLEST: {
    width: 160,
    height: Math.trunc((160 / 16) * 9),
    label: 'Smallest'
  },
  SMALL: {
    width: 240,
    height: Math.trunc((240 / 16) * 9),
    label: 'Small'
  },
  MEDIUM: {
    width: 320,
    height: Math.trunc((320 / 16) * 9),
    icon: 'view-medium-symbolic',
    label: 'Medium'
  },
  LARGE: {
    width: 400,
    height: Math.trunc((400 / 16) * 9),
    label: 'Large'
  },
  FULL: {
    width: 640,
    height: Math.trunc((640 / 16) * 9),
    label: 'Full'
  }
};

export const DEFAULT_NOTES_CONFIG = {
  width: SIZES.SMALL.width,
  height: SIZES.SMALL.height,
  position: POSITION_TYPES.TOP
};
