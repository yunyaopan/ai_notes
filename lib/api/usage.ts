import { stripe } from '@/lib/stripe/server';
import { getCustomerByUserId } from '@/lib/api/database';
import Stripe from 'stripe';

/**
 * Helper function to record meter events
 */
async function recordMeterEvent(stripeCustomerId: string, action: string, quantity: number): Promise<void> {
  await stripe.billing.meterEvents.create({
    event_name: action,
    payload: {
      value: String(Math.floor(quantity)),
      stripe_customer_id: stripeCustomerId,
    },
  });
}

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

    // Record meter event directly - no need for subscription detection
    // Meter events work independently and Stripe handles the billing
    console.log('Recording meter event for customer:', customer.stripe_customer_id);
    await recordMeterEvent(customer.stripe_customer_id, action, quantity);
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

    // Get usage directly from meter events - no subscription detection needed
    const meters = await stripe.billing.meters.list({ status: 'active' });
    if (meters.data.length === 0) {
      console.log('No active meters found');
      return { used: 0 };
    }

    // Use the first active meter (you might want to make this more specific)
    const meter = meters.data[0];
    
    // Get usage for the last 30 days (you can adjust this period)
    const currentPeriodStart = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const endTime = Math.floor(Date.now() / 60000) * 60; // align to minute

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
