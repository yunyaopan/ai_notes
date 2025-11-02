import { stripe } from '@/lib/stripe/server';
import { createCustomer, getCustomerByUserId, updateUserSubscriptionMetadata } from './database';
import { User } from '@supabase/supabase-js';
import Stripe from 'stripe';

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
 * Includes race condition handling to prevent duplicate customers.
 */
export async function ensureSubscription(user: User) {
  // Check if customer record already exists
  let customer = await getCustomerByUserId(user.id);
  
  if (customer) {
    return customer;
  }

  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID environment variable is not configured');
  }

  try {
    // Check for existing Stripe customer by email to avoid duplicates
    const existingCustomers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    let stripeCustomer: Stripe.Customer;
    
    if (existingCustomers.data.length > 0) {
      // Use existing Stripe customer
      stripeCustomer = existingCustomers.data[0];
      console.log(`Using existing Stripe customer ${stripeCustomer.id} for user ${user.id}`);
      
      // Update metadata to ensure userId is set
      if (stripeCustomer.metadata?.userId !== user.id) {
        stripeCustomer = await stripe.customers.update(stripeCustomer.id, {
          metadata: {
            userId: user.id,
            userEmail: user.email!,
          },
        });
      }
    } else {
      // Create new Stripe customer
      stripeCustomer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
          userEmail: user.email!,
        },
      });
      console.log(`Created new Stripe customer ${stripeCustomer.id} for user ${user.id}`);
    }

    // Check if this customer already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      status: 'all',
      limit: 1,
    });

    let subscription: Stripe.Subscription;
    
    if (existingSubscriptions.data.length > 0) {
      // Use existing subscription
      subscription = existingSubscriptions.data[0];
      console.log(`Using existing subscription ${subscription.id} for customer ${stripeCustomer.id}`);
      
      // Update subscription metadata to ensure userId is set
      if (subscription.metadata?.userId !== user.id) {
        subscription = await stripe.subscriptions.update(subscription.id, {
          metadata: {
            userId: user.id,
            userEmail: user.email!,
          },
        });
      }
    } else {
      // Create Stripe subscription with trial
      const trialPeriodSeconds = getTrialPeriodSeconds();
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [
          {
            price: process.env.STRIPE_PRICE_ID,
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
      console.log(`Created new subscription ${subscription.id} for customer ${stripeCustomer.id}`);
    }

    // Try to create customer record in database
    // This might fail due to race condition if another request created it
    try {
      customer = await createCustomer({
        stripe_customer_id: stripeCustomer.id,
        subscription_status: subscription.status,
        email: user.email!,
        user_id: user.id,
      });
    } catch (dbError: unknown) {
      // If it's a unique constraint violation, fetch the existing customer
      const error = dbError as { code?: string; message?: string };
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique constraint')) {
        console.log(`Customer record already exists for user ${user.id}, fetching existing record...`);
        customer = await getCustomerByUserId(user.id);
        if (!customer) {
          throw new Error('Failed to fetch existing customer after race condition');
        }
        return customer;
      }
      // Re-throw other errors
      throw dbError;
    }

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
