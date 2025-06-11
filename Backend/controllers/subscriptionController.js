const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { FRONTEND_URL } = process.env;

// Get subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update trial status if expired
    await user.updateTrialStatus();

    // Return subscription status
    return res.json({
      status: user.subscriptionStatus,
      customerId: user.stripeCustomerId,
      subscriptionId: user.stripeSubscriptionId,
      currentPeriodEnd: user.subscriptionEndDate,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      hasHadTrial: user.hasHadTrial,
      trialDays: parseInt(process.env.TRIAL_PERIOD_DAYS, 10) || 14
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Start free trial
exports.startFreeTrial = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already had a trial
    if (user.hasHadTrial) {
      return res.status(400).json({ message: 'You have already used your free trial' });
    }
    
    // Set trial period based on body param or env var
    const daysFromBody = parseInt(req.body.trialDays, 10);
    const trialDays = isNaN(daysFromBody)
      ? parseInt(process.env.TRIAL_PERIOD_DAYS, 10) || 14
      : daysFromBody;

    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    
    // Update user with trial information
    user.subscriptionStatus = 'trial';
    user.trialStartDate = trialStartDate;
    user.trialEndDate = trialEndDate;
    user.hasHadTrial = true;
    
    await user.save();
    
    return res.json({
      status: 'trial',
      trialStartDate,
      trialEndDate,
      trialDays
    });
  } catch (error) {
    console.error('Error starting free trial:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create Stripe checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    // Utiliser l'ID de prix fourni ou celui par défaut dans les variables d'environnement
    const { priceId = process.env.STRIPE_PRICE_ID } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ message: 'Price ID is required' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${FRONTEND_URL}/settings?subscription=canceled`,
      metadata: {
        userId: user._id.toString()
      }
    });
    
    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create Stripe customer portal session
exports.createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${FRONTEND_URL}/settings`,
    });
    
    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }
    
    // Cancel subscription at period end
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    return res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Handle Stripe webhook events
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Extract the user ID from metadata
      const userId = session.metadata.userId;
      
      if (userId && session.subscription) {
        // Update user with subscription info
        const user = await User.findById(userId);
        
        if (user) {
          user.stripeSubscriptionId = session.subscription;
          user.subscriptionStatus = 'active';
          
          // Get subscription details to set end date
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
          
          await user.save();
        }
      }
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      
      if (invoice.subscription) {
        // Find user with this subscription
        const user = await User.findOne({ stripeSubscriptionId: invoice.subscription });
        
        if (user) {
          // Get subscription details to update end date
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
          user.subscriptionStatus = 'active';
          user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
          
          await user.save();
        }
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      
      if (invoice.subscription) {
        // Find user with this subscription
        const user = await User.findOne({ stripeSubscriptionId: invoice.subscription });
        
        if (user) {
          user.subscriptionStatus = 'past_due';
          await user.save();
        }
      }
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      
      // Find user with this subscription
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      
      if (user) {
        // Update subscription status based on Stripe status
        switch (subscription.status) {
          case 'active':
            user.subscriptionStatus = 'active';
            break;
          case 'past_due':
            user.subscriptionStatus = 'past_due';
            break;
          case 'canceled':
            user.subscriptionStatus = 'canceled';
            break;
          case 'unpaid':
            user.subscriptionStatus = 'past_due';
            break;
          default:
            // Keep existing status
            break;
        }
        
        // Update subscription end date
        user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
        
        // Check if subscription is set to cancel at period end
        if (subscription.cancel_at_period_end) {
          user.subscriptionStatus = 'canceled';
        }
        
        await user.save();
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      // Find user with this subscription
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      
      if (user) {
        user.subscriptionStatus = 'canceled';
        user.stripeSubscriptionId = null;
        await user.save();
      }
      break;
    }
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};