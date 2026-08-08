// ==========================================
// PROFILE MODEL
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// PROFILE SCHEMA
// ==========================================

const profileSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER REFERENCE
    // ==========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true,'UserIDisrequired'],
      unique: true,
      index: true
    },

    // ==========================================
    // BASIC DEMOGRAPHICS
    // ==========================================

    gender: {
      type: String,
      enum: {
        values: ['male','female','other'],
        message: 'Gender must be male, female, or other'
      },
      required: [true,'Genderisrequired']
    },

    dateOfBirth: {
      type: Date,
      required: [true,'Dateofbirthisrequired'],
      validate: {
        validator: function(value) {
          const age = this.calculateAge(value);
          return age >= 18 && age <= 100;
        },
        message: 'Age must be between 18 and 100'
      }
    },

    // ==========================================
    // PHYSICAL ATTRIBUTES
    // ==========================================

    height: {
      type: String,
      required: [true,'Heightisrequired'],
      match: [/^[0-9]{1,3}cm$/, 'Height format should be: 170cm'],
      validate: {
        validator: function(value) {
          const cm = parseInt(value);
          return cm >= 100 && cm <= 250;
        },
        message: 'Height must be between 100cm and 250cm'
      }
    },

    bodyType: {
      type: String,
      enum: ['slim','average','athletic','heavy'],
      default: 'average'
    },

    complexion: {
      type: String,
      enum: ['fair','wheatish','dusky','dark'],
      default: null
    },

    // ==========================================
    // RELIGIOUS INFORMATION
    // ==========================================

    religion: {
      type: String,
      required: [true,'Religionisrequired'],
      enum: [
        'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 
        'Jain', 'Parsi', 'Jewish', 'Other'
      ]
    },

    caste: {
      type: String,
      required: [true,'Casteisrequired']
    },

    subCaste: {
      type: String,
      default: null
    },

    sect: {
      type: String,
      default: null
    },

    gothram: {
      type: String,
      default: null
    },

    horoscope: {
      manglik: {
        type: Boolean,
        default: null
      },

      zodiacSign: {
        type: String,
        enum: [
          'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
          'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
          'Not Known'
        ],
        default: 'Not Known'
      },

      birthTime: Date,

      birthPlace: String,

      horoscopeDocument: String
    },

    // ==========================================
    // PROFESSIONAL INFORMATION
    // ==========================================

    occupation: {
      type: String,
      required: [true,'Occupationisrequired']
    },

    employmentType: {
      type: String,
      enum: ['salaried','self_employed','business','professional','student','homemaker','retired'],
      default: null
    },

    companyName: String,

    jobTitle: String,

    industry: String,

    // ==========================================
    // EDUCATION
    // ==========================================

    education: {
      type: String,
      required: [true,'Educationisrequired'],
      enum: [
        '10th Pass', '12th Pass', 'Diploma', 'Bachelor\'s', 'Master\'s',
        'Ph.D', 'Professional Degree', 'Other'
      ]
    },

    fieldOfStudy: String,

    college: String,

    // ==========================================
    // FINANCIAL INFORMATION
    // ==========================================

    income: {
      type: Number,
      required: [true,'Incomeisrequired'],
      min: [0,'Incomecannotbenegative'],
      validate: {
        validator: function(value) {
          return value >= 0 && value <= 10000000; // Max 1 crore
        },
        message: 'Income must be between 0 and 1 crore'
      }
    },

    incomeCurrency: {
      type: String,
      default: 'INR',
      enum: ['INR','USD','GBP','EUR']
    },

    incomeFrequency: {
      type: String,
      enum: ['monthly','annual'],
      default: 'annual'
    },

    // ==========================================
    // LOCATION INFORMATION
    // ==========================================

    location: {
      country: {
        type: String,
        required: true,
        default: 'India'
      },

      state: {
        type: String,
        required: true
      },

      city: {
        type: String,
        required: true
      },

      postalCode: String,

      latitude: Number,

      longitude: Number,

      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      }
    },

    // Address where willing to settle
    willingToRelocate: {
      type: Boolean,
      default: true
    },

    preferredLocations: [
      {
        country: String,
        state: String,
        city: String
      }
    ],

    // ==========================================
    // LIFESTYLE & HABITS
    // ==========================================

    lifestyle: {
      diet: {
        type: String,
        enum: ['vegetarian','non-vegetarian','eggetarian'],
        default: null
      },

      smoking: {
        type: String,
        enum: ['yes','no','occasionally'],
        default: null
      },

      drinking: {
        type: String,
        enum: ['yes','no','occasionally'],
        default: null
      },

      exercise: {
        type: String,
        enum: ['regularly','sometimes','rarely'],
        default: null
      }
    },

    // ==========================================
    // PERSONAL DESCRIPTION
    // ==========================================

    about: {
      type: String,
      maxlength: [1000,'Aboutcannotexceed1000characters'],
      default: null
    },

    interests: [String],

    hobbies: [String],

    // ==========================================
    // MARITAL & FAMILY INFORMATION
    // ==========================================

    maritalStatus: {
      type: String,
      enum: ['never_married','divorced','widowed','separated','annulled'],
      default: 'never_married'
    },

    haveChildren: {
      type: Boolean,
      default: false
    },

    numberOfChildren: {
      type: Number,
      default: 0,
      validate: {
        validator: function(value) {
          if (!this.haveChildren && value > 0) return false;
          return value >= 0 && value <= 10;
        },
        message: 'Invalid number of children'
      }
    },

    childrenAges: [Number],

    familyStatus: {
      type: String,
      enum: ['joint_family','nuclear_family','single_parent'],
      default: null
    },

    familyValues: {
      type: String,
      enum: ['orthodox','moderate','liberal'],
      default: null
    },

    parentOccupation: {
      fatherOccupation: String,
      motherOccupation: String
    },

    numberOfBrothers: Number,

    numberOfSisters: Number,

    // ==========================================
    // PHOTOS
    // ==========================================

    photos: [
      {
        url: {
          type: String,
          required: true
        },

        isProfilePhoto: {
          type: Boolean,
          default: false
        },

        isVerified: {
          type: Boolean,
          default: false
        },

        uploadedAt: {
          type: Date,
          default: Date.now
        },

        verifiedAt: Date,

        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],

    // ==========================================
    // EXPECTATIONS
    // ==========================================

    expectations: {
      agePreference: {
        from: Number,
        to: Number
      },

      heightPreference: {
        from: String, // e.g., "150cm"
        to: String    // e.g., "180cm"
      },

      incomePreference: {
        from: Number,
        to: Number
      },

      religionPreference: [String],

      castePreference: [String],

      locationPreference: [
        {
          country: String,
          state: String,
          city: String
        }
      ],

      educationPreference: [String],

      occupationPreference: [String],

      dietPreference: [String],

      bodyTypePreference: [String],

      aboutExpectations: {
        type: String,
        maxlength: [500,'Expectationstextcannotexceed500characters']
      }
    },

    // ==========================================
    // PROFILE COMPLETION & STATUS
    // ==========================================

    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    isComplete: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['active','inactive','suspended','deleted'],
      default: 'active',
      index: true
    },

    statusReason: String,

    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    statusUpdatedAt: Date,

    // ==========================================
    // VISIBILITY & PRIVACY
    // ==========================================

    visibility: {
      isPublic: {
        type: Boolean,
        default: true
      },

      hideAge: {
        type: Boolean,
        default: false
      },

      hideLocation: {
        type: Boolean,
        default: false
      },

      hideIncome: {
        type: Boolean,
        default: false
      }
    },

    // ==========================================
    // STATISTICS
    // ==========================================

    statistics: {
      viewCount: {
        type: Number,
        default: 0,
        index: true
      },

      likeCount: {
        type: Number,
        default: 0
      },

      connectionRequestCount: {
        type: Number,
        default: 0
      },

      messageCount: {
        type: Number,
        default: 0
      },

      lastViewedAt: Date,

      lastUpdatedAt: Date
    },

    // ==========================================
    // VERIFICATION
    // ==========================================

    isVerified: {
      type: Boolean,
      default: false
    },

    verificationDocuments: [
      {
        type: {
          type: String,
          enum: ['photo_verification','income_verification','background_check'],
          required: true
        },

        document: String,

        status: {
          type: String,
          enum: ['pending','approved','rejected'],
          default: 'pending'
        },

        verifiedAt: Date,

        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],

    // ==========================================
    // PREFERENCES FOR MATCHING
    // ==========================================

    preferredMatches: {
      type: String,
      enum: ['same_religion','any_religion','open'],
      default: 'any_religion'
    },

    // ==========================================
    // TIMESTAMPS
    // ==========================================

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// ==========================================
// INDEXES
// ==========================================

// User ID index
profileSchema.index({ userId: 1 });

// Status index
profileSchema.index({ status: 1 });

// Gender index
profileSchema.index({ gender: 1 });

// Religion index
profileSchema.index({ religion: 1 });

// Location indexes
profileSchema.index({ 'location.city': 1 });
profileSchema.index({ 'location.state': 1 });
profileSchema.index({ 'location.country': 1 });

// Income index
profileSchema.index({ income: 1 });

// View count index (for popular profiles)
profileSchema.index({ 'statistics.viewCount': -1 });

// Created date index
profileSchema.index({ createdAt: -1 });

// Geo index for location-based search
profileSchema.index({ 'location.latitude': '2dsphere', 'location.longitude': '2dsphere' });

// Compound index for search
profileSchema.index({
  gender: 1,
  religion: 1,
  'location.state': 1,
  status: 1
});

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Age virtual field
profileSchema.virtual('age').get(function() {
  return this.calculateAge(this.dateOfBirth);
});

// Profile photo URL virtual
profileSchema.virtual('profilePhotoUrl').get(function() {
  const profilePhoto = this.photos.find(p => p.isProfilePhoto);
  return profilePhoto ? profilePhoto.url : null;
});

// Full location virtual
profileSchema.virtual('fullLocation').get(function() {
  return `${this.location.city}, ${this.location.state}, ${this.location.country}`;
});

// ==========================================
// METHODS
// ==========================================

// Calculate age from DOB
profileSchema.methods.calculateAge = function(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

// Method to set profile completion percentage
profileSchema.methods.calculateCompletion = function() {
  const requiredFields = [
    'gender', 'dateOfBirth', 'height', 'religion', 'caste',
    'occupation', 'education', 'income', 'location.city', 'location.state'
  ];

  const optionalFields = [
    'about', 'interests', 'hobbies', 'maritalStatus',
    'familyStatus', 'bodyType', 'complexion', 'photos'
  ];

  let completedRequired = 0;
  let completedOptional = 0;

  // Check required fields
  requiredFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value) completedRequired++;
  });

  // Check optional fields
  optionalFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      completedOptional++;
    }
  });

  const requiredPercentage = (completedRequired / requiredFields.length) * 70;
  const optionalPercentage = (completedOptional / optionalFields.length) * 30;

  this.profileCompletion = Math.round(requiredPercentage + optionalPercentage);
  this.isComplete = this.profileCompletion >= 80;

  return this.profileCompletion;
};

// Method to add photo
profileSchema.methods.addPhoto = function(url, isProfilePhoto = false) {
  if (isProfilePhoto) {
    this.photos.forEach(photo => {
      photo.isProfilePhoto = false;
    });
  }

  this.photos.push({
    url,
    isProfilePhoto,
    uploadedAt: new Date()
  });

  return this;
};

// Method to remove photo
profileSchema.methods.removePhoto = function(url) {
  this.photos = this.photos.filter(p => p.url !== url);
  return this;
};

// Method to get public profile (for display)
profileSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    userId: this.userId,
    gender: this.gender,
    age: this.age,
    height: this.height,
    bodyType: this.bodyType,
    complexion: this.complexion,
    religion: this.religion,
    caste: this.caste,
    occupation: this.occupation,
    education: this.education,
    income: this.visibility.hideIncome ? null : this.income,
    location: this.visibility.hideLocation ? null : this.location,
    about: this.about,
    interests: this.interests,
    hobbies: this.hobbies,
    maritalStatus: this.maritalStatus,
    photos: this.photos.filter(p => p.isVerified || !p.isProfilePhoto).map(p => ({
      url: p.url,
      isProfilePhoto: p.isProfilePhoto
    })),
    profileCompletion: this.profileCompletion,
    isVerified: this.isVerified,
    statistics: {
      viewCount: this.statistics.viewCount
    }
  };
};

// Method to match with another profile based on preferences
profileSchema.methods.matchScore = function(otherProfile) {
  let score = 0;
  let factors = 0;

  // Age matching
  if (this.expectations.agePreference) {
    const otherAge = otherProfile.age;
    if (otherAge >= this.expectations.agePreference.from && 
        otherAge <= this.expectations.agePreference.to) {
      score += 20;
    }
    factors += 20;
  }

  // Religion matching
  if (this.expectations.religionPreference?.length > 0) {
    if (this.expectations.religionPreference.includes(otherProfile.religion)) {
      score += 15;
    }
    factors += 15;
  }

  // Location matching
  if (this.expectations.locationPreference?.length > 0) {
    const matchesLocation = this.expectations.locationPreference.some(pref =>
      pref.city === otherProfile.location.city
    );
    if (matchesLocation) {
      score += 15;
    }
    factors += 15;
  }

  // Education matching
  if (this.expectations.educationPreference?.length > 0) {
    if (this.expectations.educationPreference.includes(otherProfile.education)) {
      score += 15;
    }
    factors += 15;
  }

  // Income matching
  if (this.expectations.incomePreference) {
    if (otherProfile.income >= this.expectations.incomePreference.from &&
        otherProfile.income <= this.expectations.incomePreference.to) {
      score += 20;
    }
    factors += 20;
  }

  return factors > 0 ? (score / factors) * 100 : 0;
};

// ==========================================
// STATICS
// ==========================================

// Static method to find by user ID
profileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId }).populate('userId', 'firstName lastName email');
};

// Static method for advanced search
profileSchema.statics.search = function(filters = {}) {
  const query = { status: 'active' };

  if (filters.gender) query.gender = filters.gender;
  if (filters.religion) query.religion = filters.religion;
  if (filters.ageFrom || filters.ageTo) {
    query.dateOfBirth = {};
    if (filters.ageFrom) {
      const dateFrom = new Date();
      dateFrom.setFullYear(dateFrom.getFullYear() - filters.ageFrom);
      query.dateOfBirth.$lte = dateFrom;
    }
    if (filters.ageTo) {
      const dateTo = new Date();
      dateTo.setFullYear(dateTo.getFullYear() - filters.ageTo);
      query.dateOfBirth.$gte = dateTo;
    }
  }

  if (filters.city) query['location.city'] = { $regex: filters.city, $options: 'i' };
  if (filters.state) query['location.state'] = { $regex: filters.state, $options: 'i' };

  if (filters.incomeFrom || filters.incomeTo) {
    query.income = {};
    if (filters.incomeFrom) query.income.$gte = filters.incomeFrom;
    if (filters.incomeTo) query.income.$lte = filters.incomeTo;
  }

  if (filters.education) query.education = filters.education;
  if (filters.occupation) query.occupation = { $regex: filters.occupation, $options: 'i' };

  return this.find(query);
};

// Static method to get trending profiles
profileSchema.statics.getTrendingProfiles = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'statistics.viewCount': -1 })
    .limit(limit);
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Update statistics on save
profileSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.statistics.lastUpdatedAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Calculate profile completion before save
profileSchema.pre('save', function(next) {
  this.calculateCompletion();
  next();
});

// ==========================================
// MODEL EXPORT
// ==========================================

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
