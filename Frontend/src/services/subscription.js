// Subscription service to handle Stripe payments and subscription status
import { API_ENDPOINTS, apiRequest } from "../config/api";

// Default trial duration from env
export const DEFAULT_TRIAL_DAYS =
  parseInt(import.meta.env.VITE_TRIAL_PERIOD_DAYS, 10) || 14;

// Subscription plans with pricing
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'price_monthly',
    name: 'Mensuel',
    price: 15,
    period: 'mois',
    savings: '0%'
  },
  QUARTERLY: {
    id: 'price_quarterly',
    name: 'Trimestriel',
    price: 30,
    period: '3 mois',
    savings: '33%'
  },
  ANNUAL: {
    id: 'price_annual',
    name: 'Annuel',
    price: 100,
    period: 'an',
    savings: '44%'
  }
};

// Subscription price in euros (for backward compatibility)
export const SUBSCRIPTION_PRICE = SUBSCRIPTION_PLANS.MONTHLY.price;

// Constants
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due'
};

// Get current subscription status
export const getSubscriptionStatus = async () => {
  try {
    const response = await apiRequest(API_ENDPOINTS.SUBSCRIPTION.STATUS);
    return response;
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    throw error;
  }
};

// Start a free trial
export const startFreeTrial = async (trialDays = DEFAULT_TRIAL_DAYS) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.SUBSCRIPTION.START_TRIAL, {
      method: 'POST',
      body: JSON.stringify({ trialDays })
    });
    return response;
  } catch (error) {
    console.error("Error starting free trial:", error);
    throw error;
  }
};

// Create a checkout session for subscription
export const createCheckoutSession = async (priceId) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.SUBSCRIPTION.CREATE_CHECKOUT, {
      method: 'POST',
      body: JSON.stringify({ priceId })
    });
    return response;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
};

// Create a portal session to manage subscription
export const createPortalSession = async () => {
  try {
    const response = await apiRequest(API_ENDPOINTS.SUBSCRIPTION.CREATE_PORTAL, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async () => {
  try {
    const response = await apiRequest(API_ENDPOINTS.SUBSCRIPTION.CANCEL, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
};

// Check if user has access (active subscription or trial)
export const checkAccess = async () => {
  try {
    const status = await getSubscriptionStatus();
    // Considérer la période d'essai comme un accès valide
    return status.status === SUBSCRIPTION_STATUS.ACTIVE || 
           status.status === SUBSCRIPTION_STATUS.TRIAL;
  } catch (error) {
    console.error("Error checking access:", error);
    return false;
  }
};

// Get trial days remaining
export const getTrialDaysRemaining = (trialEndDate) => {
  if (!trialEndDate) return 0;
  
  const now = new Date();
  const end = new Date(trialEndDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};