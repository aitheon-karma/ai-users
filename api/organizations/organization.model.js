/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const tree = require('eflex-mongoose-path-tree');

const { Schema } = mongoose;

const OrganizationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    unique: true,
    required: true,
  },
  locations: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String
    },
    emails: [{
      type: {
        type: String,
        default: "Work"
      },
      email: {
        type: String
      },
    }],
    phoneNumbers: [{
      type: {
        type: String,
        default: "Work"
      },
      number: {
        type: String
      }
    }],
    logo: {
      _id: Schema.Types.ObjectId,
      name: String,
      signedUrl: String,
      contentType: String
    },
    faxNumbers: [{
      type: {
        type: String,
        default: "Work"
      },
      number: {
        type: String
      }
    }],
    address: {
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      regionState: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    position: {
      lat: Number,
      lng: Number,
      formattedAddress: String
    },
  }],

  registeredOfficeDetails: {
    GSTIN: String,
    CIN: String,
    address: {
      addressLine1: {
        type: String,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
      },
      regionState: {
        type: String,
      },
      code: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    phoneNumbers: [{
      type: {
        type: String,
        default: "Work"
      },
      number: {
        type: String
      },
    }],
    faxNumbers: [{
      type: {
        type: String,
        default: "Work"
      },
      number: {
        type: String
      },
    }],
    emails: [{
      type: {
        type: String,
        default: "Work"
      },
      email: {
        type: String
      },
    }]
  },

  services: [{
    type: String,
    ref: 'Service',
  }],
  avatar: {
    fileStoreKey: String,
    contentType: String,
    size: Number,
  },
  avatarResolutions: {
    profile: {
      fileStoreKey: String,
      contentType: String,
      size: Number,
    },
    thumbnail: {
      fileStoreKey: String,
      contentType: String,
      size: Number,
    },
    mini: {
      fileStoreKey: String,
      contentType: String,
      size: Number,
    },
    micro: {
      fileStoreKey: String,
      contentType: String,
      size: Number,
    },
    original: {
      fileStoreKey: String,
      contentType: String,
      size: Number,
    },
  },
  testModeDate: {
    type: Date,
    default: null,
  },
  isSeedDummy: Boolean,

  profile: {
    intro: {
      type: String
    },
    avatarUrl: String,
    avatarResolutions: {
      profile: String,
      thumbnail: String,
      mini: String,
      micro: String,
      original: String,
    },
    coverImageUrl: String,
    introBackgroundStyle: {
      type: String,
      maxlength: 50,
    },
    introTextStyle: {
      type: String,
      maxlength: 50,
    },
    website: String,
    direction: {
      latitude: String,
      longitude: String,
    },
    address: String,
    openingTime: Date,
    closingTime: Date,
    phone: String,
    facebookUrl: String,
    foursquareUrl: String,
  },
  coverImage: {
    fileStoreKey: String,
    contentType: String,
    size: Number,
  },

  // BILLING INFO
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


  // Organization suppliers
  suppliers: [{
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    Status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'APPROVED'],
      default: 'REQUESTED'
    },
    _id: false,
    requesterDate: Date
  }],

  //Documents
  documents: [{
    docType: {
      type: String
    },
    contentType: {
      type: String
    },
    createdAt: {
      type: String
    },
    fileName: {
      type: String
    },
    url: {
      type: String
    },
    size: {
      type: Number
    },
    fileName: {
      type: String
    },
    driveFile: {
      type: String
    }
  }],
  parent: {
    type: String,
    required: false
  },
  settings: {
    accounting: {
      shippingCharges: Number,
      prefixes: {
        invoice: {
          prefix: String,
          count: Number
        },
        purchaseOrder: {
          prefix: String,
          count: Number
        },
        expense: {
          prefix: String,
          count: Number
        },
        receipts: {
          prefix: String,
          count: Number
        }
      },
      taxes: [
        {
          lable: String,
          percentage: Number
        }
      ],
      terms: [
        {
          title: String,
          dueDays: Number
        }
      ],
      invoiceDefaultChartAccount: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'template__accounts'
      },
      purchaseOrderDefaultChartAccount: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'template__accounts'
      },
      expenseDefaultChartAccount: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'template__accounts'
      },
      label: {
        purchaseOrders: String,
        invoices: String,
        receipts: String,
        payBills: String
      }
    }
  },

  createdBy: {
    type: Schema.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
});

// eslint-disable-next-line func-names
OrganizationSchema.pre('save', function (next, done) {
  const self = this;
  const ignoreList = ['app', 'test', 'www', 'store', 'drive', 'users', 'hr', 'dev', 'community', 'messages'];
  self.domain = self.domain.toLowerCase();

  if (ignoreList.indexOf(self.domain) > -1) {
    self.invalidate('domain', 'This Domain name is forbidden. Please use another one.');
    return next(new Error('This Domain name is forbidden. Please use another one.'));
  }
  next();

  return null;
});


OrganizationSchema.plugin(tree);
module.exports = mongoose.model('Organization', OrganizationSchema);
