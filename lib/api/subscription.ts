import { stripe } from '@/lib/stripe/server';
import { createCustomer, getCustomerByUserId, updateUserSubscriptionMetadata } from './database';
import { User } from '@supabase/supabase-js';

// Re-export getCustomerByUserId for convenience
export { getCustomerByUserId } from './database';

/**
 * Gets the trial period duration in seconds based on environment.
 * - local/dev: 2 minutes (120 seconds)
 * - uat: 2 minutes (120 seconds)
 * - prod: 90 days (7,776,000 seconds)
 * Can be overridden with TRIAL_PERIOD_SECONDS environment variable.
 */
function getTrialPeriodSeconds(): number {
  // Check if explicitly set via environment variable
  if (process.env.TRIAL_PERIOD_SECONDS) {
    const period = parseInt(process.env.TRIAL_PERIOD_SECONDS, 10);
    if (!isNaN(period) && period > 0) {
      return period;
    }
  }

  // Determine environment
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
  
  // Return based on environment
  if (env === 'prod' || env === 'production') {
    // 90 days in seconds
    return 90 * 24 * 60 * 60; // 7,776,000 seconds
  }
  
  // Default to 2 minutes for local/dev/uat
  return 2 * 60; // 120 seconds
}

/**
 * Ensures a subscription exists for the user. Creates one if it doesn't exist.
 * This function handles both email signup and social login scenarios.
 */
export async function ensureSubscription(user: User) {
  // Check if customer record already exists
  let customer = await getCustomerByUserId(user.id);
  
  if (customer) {
    return customer;
  }

  try {
    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        userId: user.id,
        userEmail: user.email!,
      },
    });

    // Create Stripe subscription with trial
    const trialPeriodSeconds = getTrialPeriodSeconds();
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [
        {
          price: 'price_1SKFb8Jn2qf03jwiNrxmKt5h',
        },
      ],
      trial_end: Math.floor(Date.now() / 1000) + trialPeriodSeconds,
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      },
      metadata: {
        userId: user.id,
        userEmail: user.email!,
      },
    });

    // Create customer record in database
    customer = await createCustomer({
      stripe_customer_id: stripeCustomer.id,
      subscription_status: subscription.status,
      email: user.email!,
      user_id: user.id,
    });

    // Update user app_metadata
    await updateUserSubscriptionMetadata(user.id, subscription.status);

    return customer;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }
}

/**
 * Gets the subscription status from user app_metadata with fallback to database
 */
export async function getSubscriptionStatus(user: User): Promise<string> {
  // First try to get from app_metadata
  const statusFromMetadata = user.app_metadata?.subscription_status;
  if (statusFromMetadata) {
    return statusFromMetadata;
  }

  // Fallback to database
  const customer = await getCustomerByUserId(user.id);
  return customer?.subscription_status || 'inactive';
}

/**
 * Checks if the user has an active subscription (trialing or active)
 */
export async function isSubscriptionOn(user: User): Promise<boolean> {
  const status = await getSubscriptionStatus(user);
  return status === 'trialing' || status === 'active';
}
