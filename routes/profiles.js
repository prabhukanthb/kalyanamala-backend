const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const Profile = require('../models/Profile');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const validation = [
  body('gender').isIn(['male','female','other']),
  body('dateOfBirth').isISO8601(),
  body('height').matches(/^[0-9]{1,3}cm$/),
  body('religion').notEmpty(),
  body('caste').notEmpty(),
  body('occupation').notEmpty(),
  body('education').notEmpty(),
  body('income').isNumeric(),
  body('city').notEmpty(),
  body('state').notEmpty(),
  body('country').notEmpty()
];

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId }).populate('userId', 'email firstName lastName phone');
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found', message: 'create profile first' });
    }
    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

router.post('/', authMiddleware, validation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
    }

    const existing = await Profile.findOne({ userId: req.userId });
    if (existing) {
      return res.status(400).json({ error: 'Profile already exists' });
    }

    const {
      gender, dateOfBirth, height, bodyType, complexion,
      religion, caste, subCaste, sect, gothram,
      occupation, employmentType, companyName, jobTitle, industry,
      education, fieldOfStudy, college,
      income, incomeCurrency, incomeFrequency,
      city, state, country, postalCode,
      willingToRelocate,
      diet, smoking, drinking, exercise,
      about, maritalStatus, haveChildren, numberOfChildren, childrenAges,
      familyStatus, familyValues, fatherOccupation, motherOccupation,
      numberOfBrothers, numberOfSisters,
      preferredMatches
    } = req.body;

    const profile = await Profile.create({
      userId: req.userId,
      gender,
      dateOfBirth,
      height,
      bodyType,
      complexion,
      religion,
      caste,
      subCaste,
      sect,
      gothram,
      occupation,
      employmentType,
      companyName,
      jobTitle,
      industry,
      education,
      fieldOfStudy,
      college,
      income: Number(income),
      incomeCurrency,
      incomeFrequency,
      location: { city, state, country, postalCode },
      willingToRelocate,
      lifestyle: { diet, smoking, drinking, exercise },
      about,
      maritalStatus,
      haveChildren,
      numberOfChildren: Number(numberOfChildren || 0),
      childrenAges: Array.isArray(childrenAges) ? childrenAges : [],
      familyStatus,
      familyValues,
      parentOccupation: {
        fatherOccupation,
        motherOccupation
      },
      numberOfBrothers,
      numberOfSisters,
      preferredMatches
    });

    return res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create profile', message: error.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const updates = req.body;

    if (updates.gender !== undefined) profile.gender = updates.gender;
    if (updates.dateOfBirth !== undefined) profile.dateOfBirth = updates.dateOfBirth;
    if (updates.height !== undefined) profile.height = updates.height;
    if (updates.bodyType !== undefined) profile.bodyType = updates.bodyType;
    if (updates.complexion !== undefined) profile.complexion = updates.complexion;
    if (updates.religion !== undefined) profile.religion = updates.religion;
    if (updates.caste !== undefined) profile.caste = updates.caste;
    if (updates.subCaste !== undefined) profile.subCaste = updates.subCaste;
    if (updates.sect !== undefined) profile.sect = updates.sect;
    if (updates.gothram !== undefined) profile.gothram = updates.gothram;
    if (updates.occupation !== undefined) profile.occupation = updates.occupation;
    if (updates.employmentType !== undefined) profile.employmentType = updates.employmentType;
    if (updates.companyName !== undefined) profile.companyName = updates.companyName;
    if (updates.jobTitle !== undefined) profile.jobTitle = updates.jobTitle;
    if (updates.industry !== undefined) profile.industry = updates.industry;
    if (updates.education !== undefined) profile.education = updates.education;
    if (updates.fieldOfStudy !== undefined) profile.fieldOfStudy = updates.fieldOfStudy;
    if (updates.college !== undefined) profile.college = updates.college;
    if (updates.income !== undefined) profile.income = Number(updates.income);
    if (updates.incomeCurrency !== undefined) profile.incomeCurrency = updates.incomeCurrency;
    if (updates.incomeFrequency !== undefined) profile.incomeFrequency = updates.incomeFrequency;

    if (updates.city !== undefined) profile.location.city = updates.city;
    if (updates.state !== undefined) profile.location.state = updates.state;
    if (updates.country !== undefined) profile.location.country = updates.country;
    if (updates.postalCode !== undefined) profile.location.postalCode = updates.postalCode;

    if (updates.willingToRelocate !== undefined) profile.willingToRelocate = updates.willingToRelocate;
    if (updates.diet !== undefined) profile.lifestyle.diet = updates.diet;
    if (updates.smoking !== undefined) profile.lifestyle.smoking = updates.smoking;
    if (updates.drinking !== undefined) profile.lifestyle.drinking = updates.drinking;
    if (updates.exercise !== undefined) profile.lifestyle.exercise = updates.exercise;

    if (updates.about !== undefined) profile.about = updates.about;
    if (updates.maritalStatus !== undefined) profile.maritalStatus = updates.maritalStatus;
    if (updates.haveChildren !== undefined) profile.haveChildren = updates.haveChildren;
    if (updates.numberOfChildren !== undefined) profile.numberOfChildren = Number(updates.numberOfChildren);
    if (updates.childrenAges !== undefined) profile.childrenAges = updates.childrenAges;
    if (updates.familyStatus !== undefined) profile.familyStatus = updates.familyStatus;
    if (updates.familyValues !== undefined) profile.familyValues = updates.familyValues;
    if (updates.fatherOccupation !== undefined || updates.motherOccupation !== undefined) {
      profile.parentOccupation = {
        fatherOccupation: updates.fatherOccupation ?? profile.parentOccupation?.fatherOccupation,
        motherOccupation: updates.motherOccupation ?? profile.parentOccupation?.motherOccupation
      };
    }
    if (updates.numberOfBrothers !== undefined) profile.numberOfBrothers = updates.numberOfBrothers;
    if (updates.numberOfSisters !== undefined) profile.numberOfSisters = updates.numberOfSisters;
    if (updates.preferredMatches !== undefined) profile.preferredMatches = updates.preferredMatches;

    await profile.save();

    return res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

module.exports = router;
