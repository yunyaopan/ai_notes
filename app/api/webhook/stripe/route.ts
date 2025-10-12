import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { createCustomer, updateCustomerSubscriptionStatus, getCustomerByStripeId } from '@/lib/api/database';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Disable body parsing to get raw body for Stripe signature verification
export const runtime = 'nodejs';

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    const stripeSignature = (await headers()).get('stripe-signature');

    event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    // On error, log and return the error message.
    if (err! instanceof Error) console.log(err);
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json(
      {message: `Webhook Error: ${errorMessage}`},
      {status: 400}
    );
  }

  // Successfully constructed event.
  console.log('✅ Webhook signature verified for event:', event.id);

  const permittedEvents: string[] = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ];

  if (permittedEvents.includes(event.type)) {
    let data;

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          data = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(data);
          break;
        case 'customer.subscription.created':
          data = event.data.object as Stripe.Subscription;
          await handleSubscriptionCreated(data);
          break;
        case 'customer.subscription.updated':
          data = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(data);
          break;
        case 'customer.subscription.deleted':
          data = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(data);
          break;
        case 'invoice.payment_succeeded':
          data = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentSucceeded(data);
          break;
        case 'invoice.payment_failed':
          data = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(data);
          break;
        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        {message: 'Webhook handler failed'},
        {status: 500}
      );
    }
  }

  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({message: 'Received'}, {status: 200});
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode === 'subscription' && session.customer) {
    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : session.customer.id;

    // Get customer details from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customerId);
    
    if (typeof stripeCustomer === 'object' && !stripeCustomer.deleted && stripeCustomer.email) {
      // Check if customer already exists
      const existingCustomer = await getCustomerByStripeId(customerId);
      
      if (!existingCustomer) {
        // Create new customer record
        try {
          await createCustomer({
            stripe_customer_id: customerId,
            subscription_status: 'active',
            email: stripeCustomer.email,
            user_id: session.metadata?.userId || '',
          });
        } catch (error) {
          console.error('Error creating customer in checkout session completed:', error);
          // Don't throw - this might be a race condition with subscription.created event
        }
      }
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  // Check if customer exists, if not create them
  const customer = await getCustomerByStripeId(customerId);
  
  if (!customer) {
    // Get customer details from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customerId);
    
    if (typeof stripeCustomer === 'object' && !stripeCustomer.deleted && stripeCustomer.email) {
      // Get user_id from subscription metadata (set via subscription_data in checkout session)
      const userId = subscription.metadata?.userId || '';
      
      if (userId) {
        try {
          await createCustomer({
            stripe_customer_id: customerId,
            subscription_status: subscription.status,
            email: stripeCustomer.email,
            user_id: userId,
          });
        } catch (error) {
          console.error('Error creating customer in subscription created:', error);
          // Don't throw - this might be a race condition with checkout.session.completed event
        }
      } else {
        console.error('Missing user_id in subscription metadata for customer:', customerId);
        console.error('Subscription metadata:', subscription.metadata);
        
        // Try to find user by email as fallback
        try {
          const supabase = await createClient();
          const { data: userData } = await supabase.auth.admin.listUsers();
          const fallbackUserId = userData?.users?.find(user => user.email === stripeCustomer.email)?.id || '';
          
          if (fallbackUserId) {
            try {
              await createCustomer({
                stripe_customer_id: customerId,
                subscription_status: subscription.status,
                email: stripeCustomer.email,
                user_id: fallbackUserId,
              });
            } catch (error) {
              console.error('Error creating customer with fallback user_id:', error);
              // Don't throw - this might be a race condition
            }
          } else {
            console.error('Could not determine user_id for customer:', customerId);
            throw new Error(`Missing user_id for customer ${customerId}`);
          }
        } catch (error) {
          console.error('Failed to create customer due to missing user_id:', error);
          throw error;
        }
      }
    }
  } else {
    // Update existing customer's subscription status
    await updateCustomerSubscriptionStatus(customerId, subscription.status);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await getCustomerByStripeId(customerId);
  
  if (customer) {
    await updateCustomerSubscriptionStatus(customerId, subscription.status);
  } else {
    console.warn('Customer not found for subscription update:', customerId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await getCustomerByStripeId(customerId);
  
  if (customer) {
    await updateCustomerSubscriptionStatus(customerId, 'canceled');
  } else {
    console.warn('Customer not found for subscription deletion:', customerId);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
  if (subscriptionId) {
    const subscriptionIdStr = typeof subscriptionId === 'string' 
      ? subscriptionId 
      : subscriptionId.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionIdStr);
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    const customer = await getCustomerByStripeId(customerId);
    
    if (customer) {
      await updateCustomerSubscriptionStatus(customerId, subscription.status);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
  if (subscriptionId) {
    const subscriptionIdStr = typeof subscriptionId === 'string' 
      ? subscriptionId 
      : subscriptionId.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionIdStr);
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    const customer = await getCustomerByStripeId(customerId);
    
    if (customer) {
      await updateCustomerSubscriptionStatus(customerId, 'past_due');
    }
  }
}
