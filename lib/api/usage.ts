import { stripe } from '@/lib/stripe/server';
import { getCustomerByUserId } from '@/lib/api/database';
import Stripe from 'stripe';

/**
 * Records usage for a user's subscription
 * This should be called whenever a billable action occurs
 */
export async function recordUsage(userId: string, action: string, quantity: number = 1): Promise<void> {
  try {
    // Get the customer record to find their Stripe customer ID
    const customer = await getCustomerByUserId(userId);
    
    if (!customer) {
      console.warn('No customer found for user:', userId);
      return;
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      console.warn('No active subscription found for customer:', customer.stripe_customer_id);
      return;
    }

    // Find subscription with usage-based pricing
    const subscription = subscriptions.data.find(sub => {
      return sub.items.data.some(item => 
        item.price.billing_scheme === 'per_unit' && 
        item.price.recurring?.usage_type === 'metered'
      );
    });

    if (!subscription) {
      console.warn('No usage-based subscription found for customer:', customer.stripe_customer_id);
      return;
    }

    // Record usage via Billing Meter Events API
    // action corresponds to the configured meter's event_name in Stripe
    await stripe.billing.meterEvents.create({
      event_name: action,
      payload: {
        // Stripe expects string values in payload
        value: String(Math.floor(quantity)),
        stripe_customer_id: customer.stripe_customer_id,
      },
      timestamp: Math.floor(Date.now() / 1000),
    });

    console.log(`Recorded usage for user ${userId}: ${quantity} ${action}`);
  } catch (error) {
    console.error('Error recording usage:', error);
    // Don't throw - we don't want usage recording failures to break the main flow
  }
}

/**
 * Gets current usage for a user's subscription
 */
export async function getCurrentUsage(userId: string): Promise<{ used: number; limit?: number } | null> {
  try {
    const customer = await getCustomerByUserId(userId);
    
    if (!customer) {
      return null;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data.find(sub => {
      return sub.items.data.some(item => 
        item.price.billing_scheme === 'per_unit' && 
        item.price.recurring?.usage_type === 'metered'
      );
    });

    if (!subscription) {
      return null;
    }

    const usageItem = subscription.items.data.find(item => 
      item.price.billing_scheme === 'per_unit' && 
      item.price.recurring?.usage_type === 'metered'
    );

    if (!usageItem) {
      return null;
    }

    // Get usage records for current billing period
    const currentPeriodStart = Math.floor((usageItem.current_period_start || 0) / 60) * 60;
    const endTime = Math.floor(Date.now() / 60000) * 60; // align to minute

    // Resolve the meter matching this action (event_name)
    const meters = await stripe.billing.meters.list({ status: 'active' });
    const meter = meters.data[0];
    if (!meter) {
      return { used: 0 };
    }

    const summaries = await stripe.billing.meters.listEventSummaries(meter.id, {
      customer: customer.stripe_customer_id,
      start_time: currentPeriodStart,
      end_time: endTime,
    });

    const totalUsage = summaries.data.reduce((sum: number, s: Stripe.Billing.MeterEventSummary) => sum + s.aggregated_value, 0);

    return {
      used: totalUsage,
      // Note: For usage-based billing, there might not be a hard limit
      // You can set limits in Stripe dashboard or implement soft limits
    };
  } catch (error) {
    console.error('Error getting current usage:', error);
    return null;
  }
}
