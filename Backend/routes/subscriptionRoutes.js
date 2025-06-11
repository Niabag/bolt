const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Get subscription status
router.get('/status', auth, subscriptionController.getSubscriptionStatus);

// Start free trial
router.post('/trial', auth, subscriptionController.startFreeTrial);

// Create checkout session
router.post('/create-checkout', auth, subscriptionController.createCheckoutSession);

// Create customer portal session
router.post('/create-portal', auth, subscriptionController.createPortalSession);

// Cancel subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

module.exports = router;