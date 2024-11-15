const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
};

const logger = {
  info: (action, details = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c[${LOG_LEVELS.INFO}] ${action}`,
        'color: #1DB954',
        details
      );
    }
  },

  warning: (action, details = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c[${LOG_LEVELS.WARNING}] ${action}`,
        'color: #FFA500',
        details
      );
    }
  },

  error: (action, error, details = {}) => {
    console.error(
      `[${LOG_LEVELS.ERROR}] ${action}`,
      { error, details }
    );
  }
};

export default logger; 