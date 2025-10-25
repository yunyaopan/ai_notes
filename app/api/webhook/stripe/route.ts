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
    // Update subscription status to canceled
    await updateCustomerSubscriptionStatus(customerId, 'canceled');
    
    // Update user app_metadata
    await updateUserSubscriptionMetadata(customer.user_id, 'canceled');
  }
}