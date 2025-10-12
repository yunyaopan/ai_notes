# Stripe Integration Guide

This guide provides a comprehensive template for implementing Stripe subscription payments in Next.js applications with Supabase authentication.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Package Dependencies](#package-dependencies)
- [Price Lookup Configuration](#price-lookup-configuration)
- [User ID Implementation](#user-id-implementation)
- [File Structure Implementation](#file-structure-implementation)
- [Critical Bugs and Issues](#critical-bugs-and-issues)
- [Middleware Updates](#middleware-updates)
- [Navigation Updates](#navigation-updates)
- [Stripe Dashboard Setup](#stripe-dashboard-setup)
- [Testing Checklist](#testing-checklist)

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Optional: Webhook secret for handling Stripe events
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe dashboard webhook settings
```

## Package Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^8.0.0",
    "stripe": "^19.1.0"
  }
}
```

## Price Lookup Configuration

**CRITICAL**: Update the `lookup_key` in your subscribe button component. you can find in the advanced options of a 'Price' object. 

```typescript
// In components/subscribe-button.tsx
body: JSON.stringify({ 
  lookup_key: 'your-product-monthly' // CHANGE THIS TO YOUR STRIPE PRICE LOOKUP KEY
}),
```

## User ID Implementation

### Overview
To properly track subscriptions and associate them with users, you need to pass the `user_id` from Supabase to Stripe and receive it back in webhook events. This ensures proper customer record creation and subscription management.

### Implementation Steps

#### 1. Pass User ID to Stripe During Checkout

When a user clicks the subscription button, the `user_id` is automatically passed to Stripe through the checkout session metadata:

```typescript
// In app/api/subscriptions/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: price.id,
      // No quantity for usage-based billing - Stripe will track usage automatically
    },
  ],
  success_url: `${request.nextUrl.origin}/subscriptions/success`,
  cancel_url: `${request.nextUrl.origin}/subscriptions?canceled=true`,
  customer_email: user.email,
  metadata: {
    userId: user.id,           // ✅ User ID passed here
    userEmail: user.email || '',
  },
  // Add subscription metadata that will be passed to the subscription
  subscription_data: {
    metadata: {
      userId: user.id,         // ✅ Also passed to subscription object
      userEmail: user.email || '',
    },
  },
});
```

#### 2. Receive User ID in Webhook Events

The webhook handlers extract the `user_id` from the event metadata and use it to create customer records:

```typescript
// In app/api/webhook/stripe/route.ts

// From checkout.session.completed event
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
            user_id: session.metadata?.userId || '',  // ✅ User ID from metadata
          });
        } catch (error) {
          console.error('Error creating customer in checkout session completed:', error);
          // Don't throw - this might be a race condition with subscription.created event
        }
      }
    }
  }
}

// From customer.subscription.created event
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
            user_id: userId,  // ✅ User ID from subscription metadata
          });
        } catch (error) {
          console.error('Error creating customer in subscription created:', error);
          // Don't throw - this might be a race condition with checkout.session.completed event
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
        }
      }
    }
  } else {
    // Update existing customer's subscription status
    await updateCustomerSubscriptionStatus(customerId, subscription.status);
  }
}
```

#### 3. Additional Webhook Events

The implementation handles multiple webhook events for comprehensive subscription management:

```typescript
const permittedEvents: string[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];
```

Each event handler includes proper error handling and race condition management.

#### 4. Race Condition Handling

The implementation includes robust error handling for race conditions where multiple webhook events might try to create the same customer:

```typescript
// In lib/api/database.ts
export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    // Handle duplicate key constraint violation
    if (error.code === '23505') {
      console.log('Customer already exists, fetching existing customer:', customerData.stripe_customer_id);
      // Return the existing customer instead of throwing an error
      const existingCustomer = await getCustomerByStripeId(customerData.stripe_customer_id);
      if (!existingCustomer) {
        throw new Error('Customer exists but could not be retrieved');
      }
      return existingCustomer;
    }
    console.error('Database error creating customer:', error);
    throw new Error('Failed to create customer');
  }

  return data;
}
```

### Key Points

1. **When user clicks subscription button**: The `user_id` is automatically passed to Stripe through both `metadata` and `subscription_data.metadata` in the checkout session
2. **Supabase middleware**: Must exclude webhook endpoints from authentication checks
3. **Testing**: Use Stripe CLI instead of ngrok for webhook testing

## File Structure Implementation

### 1. Stripe Server Configuration (`lib/stripe/server.ts`)

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});
```

### 2. Stripe Client Configuration (`lib/stripe/client.ts`)

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default stripePromise;
```

### 3. Checkout Session API (`app/api/subscriptions/create-checkout-session/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { lookup_key } = await request.json();
    
    if (!lookup_key) {
      return NextResponse.json({ error: 'Lookup key is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the price using the lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [lookup_key],
      active: true,
    });

    if (prices.data.length === 0) {
      return NextResponse.json({ error: 'Price not found' }, { status: 404 });
    }

    const price = prices.data[0];

    // Create Stripe checkout session for usage-based billing
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          // No quantity for usage-based billing - Stripe will track usage automatically
        },
      ],
      success_url: `${request.nextUrl.origin}/subscriptions/success`,
      cancel_url: `${request.nextUrl.origin}/subscriptions?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
      },
      // Add subscription metadata that will be passed to the subscription
      subscription_data: {
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      checkoutUrl: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. Subscribe Button Component (`components/subscribe-button.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lookup_key: 'your-product-monthly' // UPDATE THIS
        }),
      });

      const data = await response.json();
      
      if (data.sessionId) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Processing...' : 'Subscribe'}
    </Button>
  );
}
```

### 5. Subscription Pages

#### Subscriptions Page (`app/subscriptions/page.tsx`)

```typescript
import { Navigation } from '@/components/navigation';
import { SubscribeButton } from '@/components/subscribe-button';

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Subscribe to YourApp Pro</h1>
          <p className="text-lg text-muted-foreground">
            Get unlimited access to all features
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Pro Plan</h2>
            <div className="text-3xl font-bold mb-2">$9.99</div>
            <div className="text-muted-foreground mb-6">per month</div>
            
            <ul className="space-y-2 mb-6">
              <li>✓ Feature 1</li>
              <li>✓ Feature 2</li>
              <li>✓ Feature 3</li>
            </ul>

            <SubscribeButton />
          </div>
        </div>
      </main>
    </div>
  );
}
```

#### Success Page (`app/subscriptions/success/page.tsx`)

```typescript
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for subscribing!
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Welcome to Pro!</h2>
            <p className="text-muted-foreground mb-6">
              Your subscription is now active.
            </p>
            
            <div className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/subscriptions">
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

## Critical Bugs and Issues to Avoid

1. **Quantity Bug**: In the checkout session creation, DO NOT set `quantity` if using usage-based subscriptions. The current implementation correctly omits this and includes a comment explaining why.

2. **Race Condition Handling**: The webhook implementation includes comprehensive error handling for race conditions where multiple webhook events might try to create the same customer record.

3. **Fallback User ID Resolution**: If the `user_id` is missing from subscription metadata, the implementation includes a fallback mechanism to find the user by email address.

4. Update your middleware to allow subscription pages and webhook endpoints without authentication:

```typescript
// In lib/supabase/middleware.ts
!request.nextUrl.pathname.startsWith("/subscriptions") &&
!request.nextUrl.pathname.startsWith("/api/webhook")
```

**CRITICAL**: The webhook endpoint must be excluded from authentication checks because Stripe sends webhook events without user authentication.

## Navigation Updates

Add subscription links to your navigation:

```typescript
<Link href={"/subscriptions"} className="text-xs sm:text-sm hover:underline">
  Subscriptions
</Link>
```

## Stripe Dashboard Setup for Manual setup

1. Create a product in Stripe Dashboard
2. Set up a recurring price with a lookup key (e.g., `your-app-monthly`)
3. Test with Stripe test card: https://docs.stripe.com/testing-use-cases?utm_source=chatgpt.com#test-card-numbers

## Testing with Stripe CLI

### Setup
Instead of using ngrok for webhook testing, use the Stripe CLI for better reliability and easier debugging:

```bash
# Install Stripe CLI (if not already installed)
# macOS: brew install stripe/stripe-cli/stripe
# Or download from: https://github.com/stripe/stripe-cli/releases

# Login to your Stripe account
stripe login

# Start listening for webhook events
stripe listen --forward-to http://localhost:3000/api/webhook/stripe
```

### Environment Variable
The Stripe CLI will provide a webhook signing secret that starts with `whsec_`. Use this for your `STRIPE_WEBHOOK_SECRET` environment variable:

```bash
# In your .env.local file
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe CLI output
```

### Testing Flow
1. Start your Next.js development server: `npm run dev`
2. Start Stripe CLI webhook listener: `stripe listen --forward-to http://localhost:3000/api/webhook/stripe`
3. Copy the webhook signing secret from CLI output to your `.env.local`
4. Test subscription flow - webhook events will be forwarded to your local server
5. Monitor both your application logs and Stripe CLI output for debugging

### Benefits of Stripe CLI
- **No ngrok required**: Direct local webhook forwarding
- **Better debugging**: Real-time event monitoring
- **Reliable**: No network issues or tunnel disconnections
- **Event replay**: Can replay events for testing

## Testing Checklist

### Pre-Testing Setup
- [ ] Stripe CLI installed and logged in
- [ ] Environment variables configured (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Supabase middleware excludes webhook endpoints
- [ ] Price lookup key updated in subscribe button
- [ ] Customers table exists in Supabase

### Testing Steps
1. **Start Services**
   - [ ] Next.js dev server: `npm run dev`
   - [ ] Stripe CLI listener: `stripe listen --forward-to http://localhost:3000/api/webhook/stripe`

2. **Test Subscription Flow**
   - [ ] User can access subscription page
   - [ ] Subscribe button creates checkout session
   - [ ] Stripe checkout page loads correctly
   - [ ] Payment with test card succeeds
   - [ ] User redirected to success page

3. **Verify Webhook Processing**
   - [ ] `checkout.session.completed` event received
   - [ ] `customer.subscription.created` event received
   - [ ] `customer.subscription.updated` event handled
   - [ ] `customer.subscription.deleted` event handled
   - [ ] `invoice.payment_succeeded` event handled
   - [ ] `invoice.payment_failed` event handled
   - [ ] Customer record created in database with correct `user_id`
   - [ ] No duplicate key errors in logs
   - [ ] Subscription status updated correctly

4. **Test Race Conditions**
   - [ ] Multiple webhook events handled gracefully
   - [ ] Duplicate customer creation prevented
   - [ ] Existing customer returned instead of error

### Common Issues
- **Webhook not receiving events**: Check `STRIPE_WEBHOOK_SECRET` matches CLI output
- **Authentication errors**: Verify middleware excludes `/api/webhook` paths
- **Customer creation fails**: Check `user_id` is passed in metadata
- **Duplicate key errors**: Verify race condition handling is implemented

## Additional Notes

- This implementation uses Supabase for authentication
- The integration follows Next.js App Router patterns
- All components use TypeScript with proper type safety
- Error handling is implemented at multiple levels
- The design uses Tailwind CSS and Shadcn UI components
