const User = require('../models/User');

// Middleware to check if user has valid subscription or trial
exports.checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update trial status if expired
    await user.updateTrialStatus();

    // Check if user has valid access (subscription or trial)
    if (!user.hasValidAccess()) {
      return res.status(403).json({
        message: 'Subscription required',
        subscriptionStatus: user.subscriptionStatus
      });
    }
    
    // If subscription is valid, proceed
    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};