const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Subscription fields
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'trial', 'expired', 'canceled', 'past_due'],
    default: 'expired'
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  trialStartDate: {
    type: Date,
    default: null
  },
  hasHadTrial: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: ''
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Check if subscription or trial is valid
UserSchema.methods.hasValidAccess = function() {
  const now = new Date();
  
  // Active subscription
  if (this.subscriptionStatus === 'active' && this.subscriptionEndDate > now) {
    return true;
  }
  
  // Active trial
  if (this.subscriptionStatus === 'trial' && this.trialEndDate > now) {
    return true;
  }

  return false;
};

// Ensure subscriptionStatus is updated when trial expires
UserSchema.methods.updateTrialStatus = async function() {
  const now = new Date();
  if (this.subscriptionStatus === 'trial' && this.trialEndDate && this.trialEndDate <= now) {
    this.subscriptionStatus = 'expired';
    await this.save();
  }
};

// Method to compare password
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

