const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    profileId: {
      type: String,
      unique: true,
      index: true,
      default: null
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    approvalStatus: {
      type: String,
      enum: ['draft','pending','approved','rejected','deleted'],
      default: 'pending',
      index: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    rejectedReason: {
      type: String,
      default: null
    },

    // BASIC DETAILS
    gender: {
      type: String,
      enum: ['male','female'],
      required: true,
      index: true
    },

    dateOfBirth: {
      type: Date,
      required: true
    },

    heightFeet: {
      type: Number,
      required: true
    },

    heightInches: {
      type: Number,
      required: true
    },

    // RELIGION & FAMILY
    religion: {
      type: String,
      enum: ['Christian','Hindu','Ambedkarist','Buddhist','Other'],
      required: true
    },

    caste: {
      type: String,
      default: 'Mala',
      immutable: true
    },

    subCaste: {
      type: String,
      enum: ['SC','BC','OC','NA'],
      required: true
    },

    siblingsCount: {
      type: Number,
      default: 0
    },

    maritalStatus: {
  type: String,
  enum: ['Never married', 'Divorced', 'Widowed', 'Awaiting Divorce'],
  required: true
},

    haveChildren: {
      type: Boolean,
      default: false
    },

    familyStatus: {
  type: String,
  enum: ['nuclear_family','joint_family','single_parent','extended_family',''],
  default: '',
},
familyValues: {
  type: String,
  enum: ['rich','middle','lower','other',''],
  default: '',
},
    fatherName: {
      type: String,
      required: true
    },

    fatherOccupation: {
      type: String,
      required: true
    },

    motherName: {
      type: String,
      required: true
    },

    motherOccupation: {
      type: String,
      required: true
    },

    // PROFESSIONAL & EDUCATION
    highestEducation: {
      type: String,
      enum: [
        '10th Pass',
        '12th Pass',
        'Diploma',
        'ITI',
        'B.A',
        'B.Sc',
        'B.Com',
        'B.Tech',
        'M.A',
        'M.Sc',
        'M.Com',
        'M.Tech',
        'MBA',
        'MCA',
        'MBBS',
        'BDS',
        'MD',
        'MS',
        'PhD',
        'Other'
      ],
      required: true
    },

    fieldOfStudy: {
      type: String,
      required: true
    },

    college: {
      type: String,
      required: true
    },

    occupation: {
      type: String,
      required: true
    },

    employmentType: {
      type: String,
      enum: ['private','public','govt','business','self-employed','other'],
      required: true
    },

    companyName: {
      type: String,
      required: true
    },

    jobTitle: {
      type: String,
      required: true
    },

    jobLocation: {
      type: String,
      required: true
    },

    industry: {
      type: String,
      required: true
    },

    income: {
      type: Number,
      required: true
    },

    incomeCurrency: {
      type: String,
      default: 'INR',
      immutable: true
    },

    // CURRENT ADDRESS
    currentAddress: {
      streetName: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true,
        default: 'India'
      },
      pinCode: {
        type: String,
        required: true
      }
    },

    // ABOUT & PREFERENCE
    photos: {
      type: [photoSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: 'Maximum 3 photos allowed'
      }
    },

    aboutMe: {
      type: String,
      required: true,
      maxlength: 2000
    },

    preferredMatch: {
      type: String,
      default: 'any_religion'
    },

    // VISIBILITY / MEMBERSHIP
    membershipType: {
      type: String,
      enum: ['free','premium'],
      default: 'free',
      index: true
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    showInSearch: {
      type: Boolean,
      default: false,
      index: true
    },

    hideMobile: {
      type: Boolean,
      default: true
    },

    hideCurrentAddress: {
      type: Boolean,
      default: true
    },

    hideJobLocation: {
      type: Boolean,
      default: true
    },

    // SOFT DELETE
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // STATS
    profileViews: {
      type: Number,
      default: 0
    },

    interestCount: {
      type: Number,
      default: 0
    },

    profileCompletion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

profileSchema.index({ gender: 1, approvalStatus: 1, showInSearch: 1 });
profileSchema.index({ religion: 1 });
profileSchema.index({ membershipType: 1 });
profileSchema.index({ 'currentAddress.state': 1 });
profileSchema.index({ 'currentAddress.city': 1 });
profileSchema.index({ profileId: 1 });

profileSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

profileSchema.virtual('primaryPhoto').get(function () {
  return this.photos.find((p) => p.isPrimary) || null;
});

profileSchema.methods.calculateCompletion = function () {
  const requiredFields = [
    'gender',
    'dateOfBirth',
    'heightFeet',
    'heightInches',
    'religion',
    'subCaste',
    'siblingsCount',
    'maritalStatus',
    'haveChildren',
    'fatherName',
    'fatherOccupation',
    'motherName',
    'motherOccupation',
    'highestEducation',
    'fieldOfStudy',
    'college',
    'occupation',
    'employmentType',
    'companyName',
    'jobTitle',
    'jobLocation',
    'industry',
    'income',
    'currentAddress.streetName',
    'currentAddress.city',
    'currentAddress.state',
    'currentAddress.country',
    'currentAddress.pinCode',
    'aboutMe'
  ];

  let filled = 0;

  requiredFields.forEach((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value !== undefined && value !== null && value !== '') filled++;
  });

  this.profileCompletion = Math.round((filled / requiredFields.length) * 100);
  return this.profileCompletion;
};

profileSchema.pre('save', function (next) {
  this.calculateCompletion();
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
