// ==========================================
// CUSTOM VALIDATORS & JOI SCHEMAS
// New Kalyanamala Matrimony
// ==========================================

const Joi = require('joi');

// ==========================================
// CUSTOM REGEX PATTERNS
// ==========================================

const PATTERNS = {
  EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10}$/,
  PASSWORD: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/,
  AADHAR: /^[0-9]{12}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  PINCODE: /^[0-9]{6}$/,
  HEIGHT: /^[0-9]{1,3}cm$/,
  INCOME: /^[0-9]+$/,
  URL: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
  PHONE_WITH_CODE: /^\+[0-9]{1,3}[0-9]{6,14}$/,
  CREDIT_CARD: /^[0-9]{13,19}$/,
  MONGO_ID: /^[0-9a-f]{24}$/i
};

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

const authSchemas = {
  // Register schema
  register: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Email must be valid',
        'any.required': 'Email is required'
      }),

    phone: Joi.string()
      .pattern(PATTERNS.PHONE)
      .required()
      .messages({
        'string.pattern.base': 'Phone must be 10 digits',
        'any.required': 'Phone is required'
      }),

    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),

    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),

    password: Joi.string()
      .min(6)
      .required()
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.pattern.base': 'Password must contain uppercase letter and number',
        'any.required': 'Password is required'
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Please confirm your password'
      })
  }),

  // Login schema
  login: Joi.object({
    emailOrPhone: Joi.string()
      .required()
      .messages({
        'any.required': 'Email or phone is required'
      }),

    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Reset password schema
  resetPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email must be valid',
        'any.required': 'Email is required'
      })
  }),

  // Change password schema
  changePassword: Joi.object({
    oldPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Old password is required'
      }),

    newPassword: Joi.string()
      .min(6)
      .required()
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .messages({
        'string.min': 'New password must be at least 6 characters',
        'string.pattern.base': 'Password must contain uppercase letter and number',
        'any.required': 'New password is required'
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords must match'
      })
  }),

  // Verify email schema
  verifyEmail: Joi.object({
    email: Joi.string()
      .email()
      .required(),

    otp: Joi.string()
      .length(6)
      .pattern(/^[0-9]{6}$/)
      .required()
      .messages({
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only numbers'
      })
  })
};

// ==========================================
// PROFILE SCHEMAS
// ==========================================

const profileSchemas = {
  // Create/Update profile
  createProfile: Joi.object({
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .required(),

    dateOfBirth: Joi.date()
      .iso()
      .max('now')
      .required()
      .messages({
        'date.base': 'Invalid date format',
        'date.max': 'Date of birth cannot be in the future'
      }),

    height: Joi.string()
      .pattern(PATTERNS.HEIGHT)
      .required()
      .messages({
        'string.pattern.base': 'Height format should be: 170cm'
      }),

    bodyType: Joi.string()
      .valid('slim', 'average', 'athletic', 'heavy')
      .optional(),

    complexion: Joi.string()
      .valid('fair', 'wheatish', 'dusky', 'dark')
      .optional(),

    religion: Joi.string()
      .valid('Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Other')
      .required(),

    caste: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required(),

    subCaste: Joi.string()
      .trim()
      .optional()
      .allow(null),

    occupation: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required(),

    education: Joi.string()
      .valid('10th Pass', '12th Pass', 'Diploma', 'Bachelor\'s', 'Master\'s', 'Ph.D', 'Professional Degree', 'Other')
      .required(),

    income: Joi.number()
      .integer()
      .min(0)
      .max(10000000)
      .required()
      .messages({
        'number.base': 'Income must be a number',
        'number.max': 'Income cannot exceed 1 crore'
      }),

    location: Joi.object({
      country: Joi.string()
        .required()
        .default('India'),

      state: Joi.string()
        .required(),

      city: Joi.string()
        .required(),

      postalCode: Joi.string()
        .optional()
    }).required(),

    about: Joi.string()
      .max(1000)
      .optional()
      .allow(null),

    interests: Joi.array()
      .items(Joi.string().trim().min(2).max(50))
      .optional(),

    hobbies: Joi.array()
      .items(Joi.string().trim().min(2).max(50))
      .optional()
  }),

  // Update profile (all optional)
  updateProfile: Joi.object({
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional(),

    dateOfBirth: Joi.date()
      .iso()
      .max('now')
      .optional(),

    height: Joi.string()
      .pattern(PATTERNS.HEIGHT)
      .optional(),

    religion: Joi.string()
      .valid('Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Other')
      .optional(),

    caste: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional(),

    occupation: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    education: Joi.string()
      .valid('10th Pass', '12th Pass', 'Diploma', 'Bachelor\'s', 'Master\'s', 'Ph.D', 'Professional Degree', 'Other')
      .optional(),

    income: Joi.number()
      .integer()
      .min(0)
      .max(10000000)
      .optional(),

    city: Joi.string()
      .trim()
      .optional(),

    state: Joi.string()
      .trim()
      .optional(),

    country: Joi.string()
      .trim()
      .optional(),

    about: Joi.string()
      .max(1000)
      .optional()
      .allow(null),

    interests: Joi.array()
      .items(Joi.string().trim().min(2).max(50))
      .optional(),

    hobbies: Joi.array()
      .items(Joi.string().trim().min(2).max(50))
      .optional()
  }),

  // Search profiles
  searchProfiles: Joi.object({
    gender: Joi.string()
      .valid('male', 'female')
      .optional(),

    ageFrom: Joi.number()
      .integer()
      .min(18)
      .max(100)
      .optional(),

    ageTo: Joi.number()
      .integer()
      .min(18)
      .max(100)
      .optional(),

    city: Joi.string()
      .trim()
      .optional(),

    religion: Joi.string()
      .optional(),

    incomeFrom: Joi.number()
      .integer()
      .min(0)
      .optional(),

    incomeTo: Joi.number()
      .integer()
      .min(0)
      .optional(),

    education: Joi.string()
      .optional(),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
  })
};

// ==========================================
// CONNECTION SCHEMAS
// ==========================================

const connectionSchemas = {
  // Send connection request
  sendConnection: Joi.object({
    message: Joi.string()
      .max(200)
      .optional()
      .allow(null, '')
  }),

  // Block/Unblock user
  blockUser: Joi.object({
    reason: Joi.string()
      .max(500)
      .optional()
      .allow(null),

    duration: Joi.string()
      .pattern(/^[0-9]+[dmh]$/)
      .optional()
      .messages({
        'string.pattern.base': 'Duration format: e.g., 30d, 24h, 10m'
      })
  })
};

// ==========================================
// MESSAGE SCHEMAS
// ==========================================

const messageSchemas = {
  // Send message
  sendMessage: Joi.object({
    content: Joi.string()
      .min(1)
      .max(5000)
      .required()
      .trim()
      .messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message cannot exceed 5000 characters'
      }),

    type: Joi.string()
      .valid('text', 'image', 'document', 'audio', 'video')
      .default('text')
      .optional()
  }),

  // Get messages
  getMessages: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional(),

    from: Joi.date()
      .iso()
      .optional()
  }),

  // Search messages
  searchMessages: Joi.object({
    keyword: Joi.string()
      .min(1)
      .max(100)
      .required()
      .trim(),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
  })
};

// ==========================================
// NOTIFICATION SCHEMAS
// ==========================================

const notificationSchemas = {
  // Get notifications
  getNotifications: Joi.object({
    status: Joi.string()
      .valid('read', 'unread', 'all')
      .default('all')
      .optional(),

    type: Joi.string()
      .valid(
        'connection_request',
        'connection_accepted',
        'message',
        'profile_view',
        'like',
        'system'
      )
      .optional(),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
  }),

  // Update notification preferences
  updatePreferences: Joi.object({
    email_notifications: Joi.boolean()
      .optional(),

    push_notifications: Joi.boolean()
      .optional(),

    sms_notifications: Joi.boolean()
      .optional(),

    notification_frequency: Joi.string()
      .valid('immediate', 'daily', 'weekly', 'never')
      .optional(),

    notify_connection_requests: Joi.boolean()
      .optional(),

    notify_messages: Joi.boolean()
      .optional(),

    notify_profile_views: Joi.boolean()
      .optional(),

    notify_likes: Joi.boolean()
      .optional(),

    notify_system: Joi.boolean()
      .optional()
  })
};

// ==========================================
// ADMIN SCHEMAS
// ==========================================

const adminSchemas = {
  // List users
  listUsers: Joi.object({
    role: Joi.string()
      .valid('user', 'admin', 'superadmin')
      .optional(),

    status: Joi.string()
      .valid('active', 'inactive', 'suspended', 'deleted')
      .optional(),

    search: Joi.string()
      .max(100)
      .optional(),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
  }),

  // Make admin
  makeAdmin: Joi.object({
    adminLevel: Joi.string()
      .valid('admin', 'superadmin')
      .required()
  }),

  // Suspend user
  suspendUser: Joi.object({
    reason: Joi.string()
      .min(10)
      .max(1000)
      .required(),

    duration: Joi.string()
      .pattern(/^[0-9]+[dmh]$/)
      .default('30d')
      .optional()
      .messages({
        'string.pattern.base': 'Duration format: e.g., 30d, 24h, 10m'
      })
  }),

  // Delete user
  deleteUser: Joi.object({
    reason: Joi.string()
      .min(5)
      .max(500)
      .required(),

    permanent: Joi.boolean()
      .default(false)
      .optional()
  }),

  // Update profile status
  updateProfileStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'suspended', 'deleted')
      .required(),

    reason: Joi.string()
      .max(500)
      .optional()
  })
};

// ==========================================
// PAGINATION SCHEMA
// ==========================================

const paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
});

// ==========================================
// CUSTOM VALIDATORS
// ==========================================

const customValidators = {
  // Validate age
  validateAge: (dateOfBirth, minAge = 18, maxAge = 100) => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age >= minAge && age <= maxAge;
  },

  // Validate email format
  validateEmail: (email) => {
    return PATTERNS.EMAIL.test(email);
  },

  // Validate phone format
  validatePhone: (phone) => {
    return PATTERNS.PHONE.test(phone);
  },

  // Validate password strength
  validatePasswordStrength: (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };

    return requirements;
  },

  // Validate income range
  validateIncomeRange: (income, from, to) => {
    return income >= from && income <= to;
  },

  // Validate location exists
  validateLocation: (city, state, country) => {
    return city && state && country;
  },

  // Validate MongoDB ObjectId
  validateMongoId: (id) => {
    return PATTERNS.MONGO_ID.test(id);
  },

  // Validate URL
  validateUrl: (url) => {
    return PATTERNS.URL.test(url);
  },

  // Validate Aadhar number
  validateAadhar: (aadhar) => {
    return PATTERNS.AADHAR.test(aadhar);
  },

  // Validate PAN number
  validatePan: (pan) => {
    return PATTERNS.PAN.test(pan);
  },

  // Validate pincode
  validatePincode: (pincode) => {
    return PATTERNS.PINCODE.test(pincode);
  }
};

// ==========================================
// SCHEMA VALIDATION HELPER
// ==========================================

const validateSchema = (data, schema, options = {}) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    return {
      valid: false,
      errors,
      value: null
    };
  }

  return {
    valid: true,
    errors: [],
    value
  };
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Patterns
  PATTERNS,

  // Schemas
  authSchemas,
  profileSchemas,
  connectionSchemas,
  messageSchemas,
  notificationSchemas,
  adminSchemas,
  paginationSchema,

  // Validators
  customValidators,
  validateSchema,

  // Combined schemas for easy import
  schemas: {
    auth: authSchemas,
    profile: profileSchemas,
    connection: connectionSchemas,
    message: messageSchemas,
    notification: notificationSchemas,
    admin: adminSchemas
  }
};
