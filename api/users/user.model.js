/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  shortid = require('shortid'),
  generatePassword = require('generate-password'),
  crypto = require('crypto');

/**
 * UserSchema
 */
const UserSchema = new Schema({
  /**
   * Email
   */
  email: {
    type: String,
    lowercase: true,
    unique: [true, 'User with this email address is already exist'],
    required: true,
    maxlength: 512
  },
  /**
   * Password
   */
  password: {
    type: String,
    required: true
  },

   /**
   * Username
   */
  username: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true
  },
  /**
   * Salt for password for better encryption
   */
  salt: {
    type: String
  },
  /**
   * User type
   */
  type: [String],

  /**
   * Billing Info
   */
  billing: {
    lowBalance: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['PAID', 'SUSPENDED'],
      default: 'PAID'
    }
  },


  /**
   * Access for platform support
   */
  platformRole: {
    type: String,
    enum: ['NONE', 'PLATFORM_ADMIN', 'PLATFORM_MANAGER', 'PLATFORM_SUPPORT'],
    default: 'NONE'
  },

  /**
   * User profile data
   */
  profile: {
    firstName: {
      type: String,
      maxlength: 512
    },
    lastName: {
      type: String,
      maxlength: 512
    },
    birthday: {
      type: Date
    },
    status: {
      type: String,
      maxlength: 150
    },
    telegram: {
      username: String,
      id: String,
      chatId: String,
      groupJoined: Boolean,
      nameMatched: Boolean
    },
    avatarUrl: String,
    avatarResolutions: {
      profile: String,
      thumbnail: String,
      mini: String,
      micro: String,
      original: String
    },

    phoneNumber: {
      type: String,
      maxlength: 15
    },
    headline: {
      type: String,
      maxlength: 50
    },
    gender: {
      type: String,
      maxlength: 10
    },
    maritalStatus: {
      type: String,
      maxlength: 15
    },
    languages: [
      {
        type: String,
        maxlength: 20
      }
    ],
    interests: [
      {
        type: String,
        maxlength: 150
      }
    ],
    politicalViews: [
      {
        type: String,
        maxlength: 150
      }
    ],
    currentAddress: {
      addressLine1: {
        type: String,
        maxlength: 150
      },
      addressLine2: {
        type: String,
        maxlength: 150
      },
      city: {
        type: String,
        maxlength: 150
      },
      code: {
        type: String,
        maxlength: 10
      },
      country: {
        type: String,
        maxlength: 150
      },
      regionState: {
        type: String,
        maxlength: 150
      }
    },
    homeAddress: {
      addressLine1: {
        type: String,
        maxlength: 150
      },
      addressLine2: {
        type: String,
        maxlength: 150
      },
      city: {
        type: String,
        maxlength: 150
      },
      code: {
        type: String,
        maxlength: 10
      },
      country: {
        type: String,
        maxlength: 150
      },
      regionState: {
        type: String,
        maxlength: 150
      }
    },
    socialProfiles: {
      twitter: {
        type: String,
        maxlength: 250
      },
      instagram: {
        type: String,
        maxlength: 250
      },
      pinterest: {
        type: String,
        maxlength: 250
      }
    },
    experience: [{
      uploadFile: {
        type: String,
        maxlength: 250
      },
      roleName: {
        type: String,
        maxlength: 250
      },
      org: {
        type: Schema.ObjectId,
        ref: 'Organization'
      },
      expDay: {
        type: String,
        maxlength: 250
      },
      expMonth: {
        type: String,
        maxlength: 250
      },
      expYear: {
        type: String,
        maxlength: 250
      },
      expToDay: {
        type: String,
        maxlength: 250
      },
      expToMonth: {
        type: String,
        maxlength: 250
      },
      expToYear: {
        type: String,
        maxlength: 250
      },
      currentWorkHere: {
        type: String,
        maxlength: 250
      },
      addressLine1: {
        type: String,
        maxlength: 250
      },
      addressLine2: {
        type: String,
        maxlength: 250
      },
      aboutText: {
        type: String,
        maxlength: 500
      }
    }],
    education: [{
      uploadFile: {
        type: String,
        maxlength: 250
      },
      org: {
        type: Schema.ObjectId,
        ref: 'Organization'
      },
      department: {
        type: String,
        maxlength: 250
      },
      eduYear: {
        type: String,
        maxlength: 250
      }
    }],
    licence: [{
      uploadFile: {
        type: String,
        maxlength: 250
      },
      licencestitle: {
        type: String,
        maxlength: 250
      },
      org: {
        type: Schema.ObjectId,
        ref: 'Organization'
      },
      credentialid: {
        type: String,
        maxlength: 250
      }
    }]
  },
  personal: {
    intro: {
      type: String,
      maxlength: 500
    },
    coverImageUrl: String,
    introBackgroundStyle: {
      type: String,
      maxlength: 50
    },
    introTextStyle: {
      type: String,
      maxlength: 50
    },
  },
  professional: {
    intro: {
      type: String,
      maxlength: 500
    },
    coverImageUrl: String,
    introBackgroundStyle: {
      type: String,
      maxlength: 50
    },
    introTextStyle: {
      type: String,
      maxlength: 50
    },
  },
  dating: {
    intro: {
      type: String,
      maxlength: 500
    },
    coverImageUrl: String,
    introBackgroundStyle: {
      type: String,
      maxlength: 50
    },
    introTextStyle: {
      type: String,
      maxlength: 50
    },
  },
  // User profile level permissions
  permissions: {
    personalView: {
      personal: Boolean,
      professional: Boolean,
      dating: Boolean,
    },
    organizationalView: {
      personal: Boolean,
      professional: Boolean,
      dating: Boolean,
    },
    datingView: {
      personal: Boolean,
      professional: Boolean,
      dating: Boolean,
    },
  },
  /**
   * User disabled email notifications from email Blaster
   */
  unsubscribedEmail: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  secondFactorAuthStatus: {
    default: 'EMAIL',
    type: String,
    enum: [
      'EMAIL'
    ]
  },
  /**
  * User services
  */
  services: [{
    type: String,
    ref: 'Service'
  }],
  dockServices: [{
    type: String,
    ref: 'Service'
  }],
  avatar: {
    fileStoreKey: String,
    contentType: String,
    size: Number
  },
  avatarResolutions: {
    profile: {
      fileStoreKey: String,
      contentType: String,
      size: Number
    },
    thumbnail: {
      fileStoreKey: String,
      contentType: String,
      size: Number
    },
    mini: {
      fileStoreKey: String,
      contentType: String,
      size: Number
    },
    micro: {
      fileStoreKey: String,
      contentType: String,
      size: Number
    },
    original: {
      fileStoreKey: String,
      contentType: String,
      size: Number
    }
  },
  personalCoverImage: {
    fileStoreKey: String,
    contentType: String,
    size: Number
  },
  professionalCoverImage: {
    fileStoreKey: String,
    contentType: String,
    size: Number
  },
  datingCoverImage: {
    fileStoreKey: String,
    contentType: String,
    size: Number
  },
  /**
  * Roles in organizations
  */
  roles: [{
    _id: false,
    organization: {
      type: Schema.ObjectId,
      ref: 'Organization',
    },
    role: {
      type: String,
      enum: ['Owner', 'SuperAdmin', 'OrgAdmin', 'User'],
      default: 'User'
    },
    teams: [{
      type: Schema.ObjectId,
      ref: 'Team'
    }],
    services: [{
      service: {
        type: String,
        ref: 'Service',
      },
      role: {
        type: String,
        enum: ['ServiceAdmin', 'User'],
        default: 'User'
      }
    }]
  }],
  /**
   * Disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Deleted
   */
  deleted: {
    type: Boolean,
    default: false
  },
  /**
   * Sysadmin flag
   */
  sysadmin: {
    type: Boolean,
    default: undefined,
    set: function (value) {
      // Protect value. It's Readonly and can be changed only from DB directly.
      // console.log('Sysadmin setting, ', value, 'Default: ', this.sysadmin);
      return this.sysadmin;
    }
  },
  /**
  * Reset password token
  */
  resetPasswordToken: { type: String },
  /**
  * Reset password token expires time
  */
  resetPasswordExpires: { type: Date },
  KYCStatus: {
    type: String,
    default: 'NONE',
    enum: [
      'NONE', // have not uploaded documents
      'PENDING', // Documents uploaded, waiting for image recognition of ID
      'IMAGE_VERIFIED', // Images matched ID
      'VERIFY_FINISHED', // kyc background check run on verified ID and passed
      'DENIED_IMAGE', // Documents failed Image recognition
      'DENIED_BACKGROUND' // User Failed Background Check
    ]
  },

  /**
  * Check if onboarding is completed
  */
  onBoarded: {
    type: Boolean,
    default: false
  },
  /**
   * Users unique code
   */
  referralCode: {
    type: String,
    unique: true
  },
  /**
   * Referred By user
   */
  referredByUser: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  /**
   * Information from where we get and populate a user
   */
  contactsSource: {
    type: String,
    default: 'AITHEON',
    enum: [
      'RELIANCE',
      'AITHEON'
    ]
  },
  envAccess: {
    type: String,
    default: 'PROD',
    enum: [
      'ALPHA',
      'BETA',
      'PROD'
    ]
  },
  flagged: {
    status: {
      type: Boolean,
      default: false,
    },
    comment: String,
    updatedAt: Date
  },
  // TODO: move to separate collection at device manager
  devicesPin: {
    type: Number,
    unique: true
  },
  instagram_account: {
    type: Schema.Types.Mixed
  },
  youtube_account: {
    type: Schema.Types.Mixed
  },
  flickr_account: {
    type: Schema.Types.Mixed
  },
  /**
 * Email Routing
 */
  emailRouting: {
    emailPrefix: {
      type: String
    }
  },
  isEnabledLoginSecondFactorAuth: {
    type: Boolean,
    default: false
  },
  pushNotificationsBannerDisabled: {
    type: Boolean,
    default: false
  }
}, {
  /**
  * Added createdAt and updatedAt datetime fields
  */
  timestamps: true
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
  if (this.password && this.isModified('password') && !this.ignoreHash) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
  }

  if (this.isNew) {
    let ctx = this;
    referralCodeGenerate(ctx, () => {
      devicesPinGenerate(ctx, next);
    });
  } else {
    next();
  }
});

/**
 * Generate unique short code id, with check
 */
function referralCodeGenerate(ctx, next) {
  let referralCode = shortid.generate();
  mongoose.models["User"].findOne({ referralCode: referralCode }).then((user) => {
    if (user) {
      referralCodeGenerate(ctx, callback)
    } else {
      ctx.referralCode = referralCode;
      next();
    }
  }, (err) => {
    next(err)
  })
}

/**
 * Generate unique short code id, with check
 */
function devicesPinGenerate(ctx, next) {
  let devicesPin = Math.floor(100000 + Math.random() * 900000)
  mongoose.models["User"].findOne({ devicesPin: devicesPin }).then((user) => {
    if (user) {
      devicesPinGenerate(ctx, callback)
    } else {
      ctx.devicesPin = devicesPin;
      next();
    }
  }, (err) => {
    next(err)
  })
}

// Math.floor(100000 + Math.random() * 900000)
/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return sha1Hash(password, this.salt);
  } else {
    return password;
  }
};

function sha1Hash(password, salt) {
  return crypto.pbkdf2Sync(password, new Buffer(salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
}

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

/**
* Generates a random passphrase that passes the owasp test
* Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
* NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
*/
UserSchema.statics.generateRandomPassphrase = function () {
  return new Promise(function (resolve, reject) {
    var password = '';
    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 10 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * (10)) + 10, // randomize length between 10 and 20 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true
      });

      // check if we need to remove any repeating characters
      password = password.replace(repeatingCharacters, '');
    }

    // resolve with the validated passphrase
    resolve(password);

    // // Send the rejection back if the passphrase fails to pass the strength test
    // if (owasp.test(password).errors.length) {
    //   reject(new Error('An unexpected problem occured while generating the random passphrase'));
    // } else {
    //   // resolve with the validated passphrase
    //   resolve(password);
    // }
  });
};

UserSchema.statics.saltAndHasPassword = function (password) {
  let result = {};
  result.salt = crypto.randomBytes(16).toString('base64');
  result.password = sha1Hash(password, result.salt);
  return result;
}

UserSchema.statics.getViewTypeString = function (viewType) {
  const availableViewTypes = [
    'PERSONAL',
    'PROFESSIONAL'
  ];
  if (!viewType || isNaN(viewType) || parseInt(viewType) < 1 || parseInt(viewType) > availableViewTypes.length) {
    return availableViewTypes[0];
  }
  // viewType starts with 1 on client side
  return availableViewTypes[parseInt(viewType) - 1];
}

module.exports = mongoose.model('User', UserSchema);
