const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
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

    roleOwner: {
      type: String,
      enum: ['user','subadmin','admin'],
      default: 'user'
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

    // =========================
    // REQUIRED PROFILE FIELDS
    // =========================
    fullName: {
      type: String,
      required: true,
      trim: true
    },

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

    heightCm: {
      type: Number,
      required: true
    },

    heightFeet: {
      type: String,
      default: null
    },

    caste: {
      type: String,
      default: 'Mala',
      required: true
    },

    subCaste: {
      type: String,
      enum: ['SC','BC','OC','Other'],
      required: true
    },

    religion: {
      type: String,
      enum: ['Hindu','Christian','Ambedkar','Buddhist','NotApplicable'],
      required: true
    },

    maritalStatus: {
      type: String,
      enum: ['Nevermarried','Divorced','Widowed','AwaitingDivorce'],
      required: true
    },

    education: {
      type: String,
      required: true
    },

    fieldOfStudy: {
      type: String,
      required: true
    },

    employedIn: {
      type: String,
      enum: ['private','public','govt','business','self-employed','other'],
      required: true
    },

    occupation: {
      type: String,
      required: true
    },

    jobTitle: {
      type: String,
      required: true
    },

    workLocation: {
      type: String,
      required: true
    },

    annualIncome: {
      type: Number,
      required: true
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

    siblingsCount: {
      type: Number,
      required: true,
      default: 0
    },

    currentAddress: {
      location: {
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
        required: true
      }
    },

    photos: {
      type: [photoSchema],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 3;
        },
        message: 'Maximum 3 photos allowed'
      }
    },

    aboutMe: {
      type: String,
      required: true,
      maxlength: 2000
    },

    // =========================
    // MEMBERSHIP / VISIBILITY
    // =========================
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

    isPublic: {
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

    hideWorkLocation: {
      type: Boolean,
      default: true
    },

    // =========================
    // ADMIN / MODERATION
    // =========================
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

    // =========================
    // STATISTICS
    // =========================
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

// =========================
// INDEXES
// =========================
profileSchema.index({ gender: 1, approvalStatus: 1, showInSearch: 1 });
profileSchema.index({ caste: 1, subCaste: 1 });
profileSchema.index({ religion: 1 });
profileSchema.index({ membershipType: 1 });
profileSchema.index({ profileId: 1 });
profileSchema.index({ 'currentAddress.state': 1 });
profileSchema.index({ 'currentAddress.city': 1 });

// =========================
// VIRTUALS
// =========================
profileSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

profileSchema.virtual('primaryPhoto').get(function () {
  return this.photos.find((p) => p.isPrimary) || null;
});

// =========================
// METHODS
// =========================
profileSchema.methods.calculateCompletion = function () {
  const requiredFields = [
    'fullName',
    'gender',
    'dateOfBirth',
    'heightCm',
    'caste',
    'subCaste',
    'religion',
    'maritalStatus',
    'education',
    'fieldOfStudy',
    'employedIn',
    'occupation',
    'jobTitle',
    'workLocation',
    'annualIncome',
    'fatherName',
    'fatherOccupation',
    'motherName',
    'motherOccupation',
    'siblingsCount',
    'currentAddress.location',
    'currentAddress.city',
    'currentAddress.state',
    'currentAddress.country',
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

// =========================
// PRE SAVE
// =========================
profileSchema.pre('save', function (next) {
  this.calculateCompletion();
  next();
});

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;
