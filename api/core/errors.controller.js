'use strict';

const path = require('path');

const DEFAULTS = {
  SERVER_ERROR_MESSAGE: 'Internal Server Error',
  SERVER_ERROR_CODE: 500
}

const API_ERROR_NAMES = {
  AERR_NOT_FOUND: 'AERR_NOT_FOUND',
  AERR_CONFLICT: 'AERR_CONFLICT',
  AERR_STATE_UNDEF: 'AERR_STATE_UNDEF',
  AERR_NOT_AUTH: 'AERR_NOT_AUTH'
};

const API_ERROR_STATUS_CODES = {
  [API_ERROR_NAMES.AERR_NOT_AUTH]: 401,
  [API_ERROR_NAMES.AERR_NOT_FOUND]: 404,
  [API_ERROR_NAMES.AERR_CONFLICT]: 409,
  [API_ERROR_NAMES.AERR_STATE_UNDEF]: 500
};

class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorNotFound extends CustomError {
  constructor(message) {
    super(message, API_ERROR_NAMES.AERR_NOT_FOUND);
  }
}

class ErrorUndefinedState extends CustomError {
  constructor(message) {
    super(message, API_ERROR_NAMES.AERR_STATE_UNDEF);
  }
}

class ErrorConflict extends CustomError {
  constructor(message) {
    super(message, API_ERROR_NAMES.AERR_CONFLICT);
  }
}

class ErrorNotAuthorized extends CustomError {
  constructor(message) {
    super(message, API_ERROR_NAMES.AERR_NOT_AUTH);
  }
}

module.exports.API_ERROR_NAMES = API_ERROR_NAMES;
module.exports.API_ERROR_STATUS_CODES = API_ERROR_STATUS_CODES;
module.exports.ErrorNotFound = ErrorNotFound;
module.exports.ErrorConflict = ErrorConflict;
module.exports.ErrorUndefinedState = ErrorUndefinedState;
module.exports.ErrorNotAuthorized = ErrorNotAuthorized;
module.exports.errorResponse = function(res, err){
  res.status(API_ERROR_STATUS_CODES[err.code] || DEFAULTS.SERVER_ERROR_CODE)
    .send({message: API_ERROR_STATUS_CODES[err.code] ? err.message : DEFAULTS.SERVER_ERROR_MESSAGE});
}

/**
 * Module dependencies
 */


/**
 * Get unique error field name
 */
var getUniqueErrorMessage = function (err) {
  var output;

  try {
    var begin = 0;
    if (err.errmsg.lastIndexOf('.$') !== -1) {
      // support mongodb <= 3.0 (default: MMapv1 engine)
      // "errmsg" : "E11000 duplicate key error index: mean-dev.users.$email_1 dup key: { : \"test@user.com\" }"
      begin = err.errmsg.lastIndexOf('.$') + 2;
    } else {
      // support mongodb >= 3.2 (default: WiredTiger engine)
      // "errmsg" : "E11000 duplicate key error collection: mean-dev.users index: email_1 dup key: { : \"test@user.com\" }"
      begin = err.errmsg.lastIndexOf('index: ') + 7;
    }
    var fieldName = err.errmsg.substring(begin, err.errmsg.lastIndexOf('_1'));
    output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';

  } catch (ex) {
    output = 'Unique field already exists';
  }

  return output;
};

/**
 * Get the error message from error object
 */
exports.getErrorMessage = function (err) {
  var message = '';

  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        break;
      case 'UNSUPPORTED_MEDIA_TYPE':
        message = 'Unsupported filetype';
        break;
      case 'LIMIT_FILE_SIZE':
        // message = 'Image file too large. Maximum size allowed is ' + (config.uploads.profile.image.limits.fileSize / (1024 * 1024)).toFixed(2) + ' Mb files.';
        message = 'Image file too large. Maximum size allowed is ' + 2 + ' Mb files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Missing `newProfilePicture` field';
        break;
      default:
        message = 'Something went wrong';
    }
  } else if (err.message && !err.errors) {
    message = err.message;
  } else {
    for (var errName in err.errors) {
      if (err.errors[errName].message) {
        message = err.errors[errName].message;
      }
    }
  }

  return message;
};


exports.error404 = function(req, res) {
  if (req.accepts('html')) {
    res.sendFile(path.resolve('./api/core/404.html'));
  }
  else if (req.accepts('json')) {
    // Respond with json.
    res.status(404).send({ message: 'Not found' });
  }
  else {
    // Default to plain-text. send()
    res.status(404).type('txt').send('Not found');
  }
};

exports.response = (req, res, err) => {
  const message = exports.getErrorMessage(err);
  if (req.accepts('html')) {
    res.render(path.resolve('./api/core/error.html'), {
      message: message
    });
  } else if (req.accepts('json')) {
    // Respond with json.
    res.status(400).send({
      message: message
    });
  } else {
    // Default to plain-text. send()
    res.status(400).type('txt').send(message);
  }
}
