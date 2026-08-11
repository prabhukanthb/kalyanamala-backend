const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    gender: { type: String, enum: ['male','female','other'], required: true },
    dateOfBirth: { type: Date, required: true },
    height: { type: String, required: true },
    bodyType: { type: String, enum: ['slim','average','athletic','heavy'], default: 'average' },
    complexion: { type: String, enum: ['fair','wheatish','dusky','dark'], default: null },

    religion: { type: String, required: true },
    caste: { type: String, required: true },
    subCaste: { type: String, default: null },
    sect: { type: String, default: null },
    gothram: { type: String, default: null },

    occupation: { type: String, required: true },
    employmentType: { type: String, default: null },
    companyName: String,
    jobTitle: String,
    industry: String,

    education: { type: String, required: true },
    fieldOfStudy: String,
    college: String,

    income: { type: Number, required: true },
    incomeCurrency: { type: String, default: 'INR' },
    incomeFrequency: { type: String, default: 'annual' },

    location: {
      country: { type: String, default: 'India' },
      state: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: String
    },

    willingToRelocate: { type: Boolean, default: true },

    lifestyle: {
      diet: { type: String, default: null },
      smoking: { type: String, default: null },
      drinking: { type: String, default: null },
      exercise: { type: String, default: null }
    },

    about: { type: String, default: null },

    maritalStatus: { type: String, default: 'never_married' },
    haveChildren: { type: Boolean, default: false },
    numberOfChildren: { type: Number, default: 0 },
    childrenAges: [Number],

    familyStatus: { type: String, default: null },
    familyValues: { type: String, default: null },

    parentOccupation: {
      fatherOccupation: String,
      motherOccupation: String
    },

    numberOfBrothers: Number,
    numberOfSisters: Number,

    photos: [
      {
        url: { type: String, required: true },
        isProfilePhoto: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false }
      }
    ],

    profileCompletion: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false },
    status: { type: String, default: 'active' },
    isVerified: { type: Boolean, default: false },
    preferredMatches: { type: String, default: 'any_religion' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
