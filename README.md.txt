# Kalyanamala Matrimony Backend

🎉 **A Complete Backend API for Matrimonial Matchmaking Platform**

> Modern, scalable, and secure backend solution for matrimonial services with real-time messaging, advanced matching, and admin controls.

![Node.js](https://img.shields.io/badge/Node.js-18.0+-green)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green)
![Status](https://img.shields.io/badge/Status-Development-orange)

---

## 📋 Table of Contents

- [Features](#features)
- [TechStack](#tech-stack)
- [ProjectStructure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [RunningtheApplication](#running-the-application)
- [DatabaseModels](#database-models)
- [APIEndpoints](#api-endpoints)
- [Authentication](#authentication)
- [ErrorHandling](#error-handling)
- [DevelopmentGuidelines](#development-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### 👥 User Management
- ✅ User registration and authentication (JWT)
- ✅ Email and phone verification with OTP
- ✅ Password reset and change functionality
- ✅ User profile management
- ✅ Role-based access control (User, Admin, Superadmin)
- ✅ Account suspension and deletion

### 💍 Profile Management
- ✅ Comprehensive profile creation with demographics
- ✅ Photo management and verification
- ✅ Horoscope and astrological information
- ✅ Professional details and education
- ✅ Financial information with income tracking
- ✅ Lifestyle preferences and habits
- ✅ Marital and family information
- ✅ Automatic profile completion scoring

### 🔗 Connections & Matching
- ✅ Connection request system (send, accept, reject)
- ✅ Advanced matching algorithm with score calculation
- ✅ Block/unblock users
- ✅ Connection preferences (interested, maybe, not interested)
- ✅ Match suggestions based on criteria
- ✅ Recent conversations and pending requests

### 💬 Messaging System
- ✅ Real-time messaging between connected users
- ✅ Message read/delivery status tracking
- ✅ Message editing and deletion (soft delete)
- ✅ Emoji reactions on messages
- ✅ Message threading and replies
- ✅ Media attachments support
- ✅ Message search and filtering
- ✅ Conversation management (archive, mute, pin)
- ✅ Call history tracking

### 🔔 Notifications
- ✅ Multi-channel notifications (In-app, Email, Push, SMS)
- ✅ 16+ notification types
- ✅ Priority-based notifications
- ✅ Notification preferences and scheduling
- ✅ Engagement tracking (clicks, shares, likes)
- ✅ Notification archival and cleanup

### 🛡️ Admin Panel
- ✅ User management and analytics
- ✅ Profile moderation and status updates
- ✅ Report handling and resolution
- ✅ User suspension and deletion
- ✅ System statistics and logging
- ✅ Audit trail tracking
- ✅ Database backup functionality

### 🔐 Security Features
- ✅ JWT-based authentication
- ✅ Password hashing (bcryptjs)
- ✅ Input validation and sanitization
- ✅ Role-based authorization
- ✅ Rate limiting support
- ✅ Error logging and monitoring
- ✅ SQL injection prevention
- ✅ XSS protection

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18+
- **Language:** JavaScript (ES6+)

### Database
- **Primary DB:** MongoDB 5.0+
- **ODM:** Mongoose 7.0+

### Authentication & Security
- **JWT:** jsonwebtoken
- **Password Hashing:** bcryptjs
- **Validation:** Joi (schema validation)
- **Environment:** dotenv

### Additional Libraries
- **CORS:** cors
- **Morgan:** Request logging
- **Helmet:** Security headers
- **Express-validator:** Input validation

### Development Tools
- **Linter:** ESLint
- **Formatter:** Prettier
- **Package Manager:** npm

---

## 📁 Project Structure

