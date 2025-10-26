import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createCustomer, updateCustomerSubscriptionStatus, getCustomerByStripeId, updateUserSubscriptionMetadata } from '@/lib/api/database';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  // Check if customer already exists
  const existingCustomer = await getCustomerByStripeId(customerId);
  
  if (existingCustomer) {
    // Update existing customer's subscription status
    await updateCustomerSubscriptionStatus(customerId, subscription.status);
    await updateUserSubscriptionMetadata(existingCustomer.user_id, subscription.status);
    return;
  }

  // Get customer details from Stripe
  const stripeCustomer = await stripe.customers.retrieve(customerId);
  
  if (typeof stripeCustomer === 'object' && !stripeCustomer.deleted && stripeCustomer.email) {
    // Get user_id from subscription metadata
    const userId = subscription.metadata?.userId || '';
    
    if (userId) {
      try {
        await createCustomer({
          stripe_customer_id: customerId,
          subscription_status: subscription.status,
          email: stripeCustomer.email,
          user_id: userId,
        });

        // Update user app_metadata
        await updateUserSubscriptionMetadata(userId, subscription.status);
      } catch (error) {
        console.error('Error creating customer in subscription created:', error);
        throw error;
      }
    } else {
      // Fallback: try to find user by email
      const supabase = await createClient();
      const { data: userData } = await supabase.auth.admin.listUsers();
      const fallbackUserId = userData?.users?.find(user => user.email === stripeCustomer.email)?.id || '';
      
      if (fallbackUserId) {
        await createCustomer({
          stripe_customer_id: customerId,
          subscription_status: subscription.status,
          email: stripeCustomer.email,
          user_id: fallbackUserId,
        });

        await updateUserSubscriptionMetadata(fallbackUserId, subscription.status);
      }
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await getCustomerByStripeId(customerId);
  
  if (customer) {
    // Update subscription status in database
    await updateCustomerSubscriptionStatus(customerId, subscription.status);
    
    // Update user app_metadata
    await updateUserSubscriptionMetadata(customer.user_id, subscription.status);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await getCustomerByStripeId(customerId);
  
  if (customer) {
    console.log(`Subscription deleted for customer ${customerId}, user ${customer.user_id}. Reason: ${subscription.cancel_at_period_end ? 'End of billing period' : 'Immediate cancellation'}`);
    
    // Update subscription status to canceled
    await updateCustomerSubscriptionStatus(customerId, 'canceled');
    
    // Update user app_metadata
    await updateUserSubscriptionMetadata(customer.user_id, 'canceled');
    
    console.log(`Successfully updated subscription status to canceled for user ${customer.user_id}`);
  } else {
    console.warn(`No customer found for deleted subscription ${subscription.id} with customer ID ${customerId}`);
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await getCustomerByStripeId(customerId);
  
  if (customer) {
    console.log(`Trial will end for customer ${customerId}, user ${customer.user_id}. Trial ends at: ${new Date(subscription.trial_end! * 1000).toISOString()}`);
    
    // Here you could implement additional logic such as:
    // - Send email notification to customer
    // - Show in-app notification
    // - Log analytics event
    // - Check if customer has payment method and warn if not
    
    // For now, we'll just log the event
    console.log(`Trial ending notification processed for user ${customer.user_id}`);
  } else {
    console.warn(`No customer found for trial ending subscription ${subscription.id} with customer ID ${customerId}`);
  }
}