# Stripe Integration Guide

13 Oct 2025

This guide provides a comprehensive template for implementing Stripe subscription payments in Next.js applications with Supabase authentication.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Package Dependencies](#package-dependencies)
- [Subscribe button](#subscribe-button)
- [Implementation of the create-checkout-session API, webhook and creation of user in my own DB]
- [File Structure Implementation](#file-structure-implementation)
- [Critical Bugs and Issues](#critical-bugs-and-issues)
- [Stripe Dashboard Setup](#stripe-dashboard-setup)
- [Testing Checklist](#testing-checklist)
- [Usage Tracking Implementation](#usage-tracking-implementation)

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

## Subscribe button

**CRITICAL**: Update the `lookup_key` in your subscribe button component. The lookup_key value can be found in the advanced options of a 'Price' object in the Stripe portal. 

```typescript
// In components/subscribe-button.tsx
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
          lookup_key: 'mindsort-pro-monthly'
        }),
      });

      const data = await response.json();
      
      if (data.sessionId) {
        // Redirect to Stripe Checkout using the session URL
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

## Implementation of the create-checkout-session API, webhook and creation of user in my own DB

### Overview
To properly track subscriptions and associate them with users, you need to pass the `user_id` from Supabase to Stripe and receive it back in webhook events. This ensures proper customer record creation and subscription management.

### Implementation Steps

#### 1. Pass User ID to Stripe During Checkout

When a user clicks the subscription button, the `user_id` is automatically passed to Stripe through the subscription metadata:

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
  // Add subscription metadata that will be passed to the subscription
  subscription_data: {
    metadata: {
      userId: user.id,         // ✅ User ID passed to subscription object
      userEmail: user.email || '',
    },
  },
});
```

#### 2. Receive User ID in Webhook Events

The webhook handlers extract the `user_id` from the event metadata and use it to create customer records:

```typescript
// In app/api/webhook/stripe/route.ts

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
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];
```

Each event handler includes proper error handling.

#### 3. Customer Creation

The implementation creates customers only when subscriptions are created, ensuring a single source of truth:

```typescript
// In lib/api/database.ts
export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
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

## Usage Tracking Implementation

The `lib/api/usage.ts` file provides usage-based billing functionality. Just call this function during the event which shall incur charges.

- **`recordUsage(userId, action, quantity)`**: Records billable actions via Stripe meter events
- **`getCurrentUsage(userId)`**: Retrieves usage data from Stripe meter summaries (30-day period)
- **Meter Events**: Works independently of subscription status - Stripe handles billing automatically
- **Error Handling**: Usage recording failures don't break main application flow
- **Customer Lookup**: Requires existing customer record with `stripe_customer_id`

The `lib/api/usage.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUsage } from '@/lib/api/usage';
import { getCustomerByUserId } from '@/lib/api/database';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer record
    const customer = await getCustomerByUserId(user.id);
    
    if (!customer) {
      return NextResponse.json({ 
        hasSubscription: false,
        subscriptionStatus: 'none',
        usage: null 
      });
    }

    // Get current usage
    const usage = await getCurrentUsage(user.id);

    return NextResponse.json({
      hasSubscription: true,
      subscriptionStatus: customer.subscription_status,
      usage: usage,
      customer: {
        id: customer.id,
        stripe_customer_id: customer.stripe_customer_id,
        email: customer.email,
        created_at: customer.created_at,
      }
    });
  } catch (error) {
    console.error('Usage status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage status' },
      { status: 500 }
    );
  }
}

```

## Other setup files

### 1. Stripe Server Configuration (`lib/stripe/server.ts`)

```typescript
import Stripe from 'stripe';
// in the backend, use the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});
```

### 2. Stripe Client Configuration (`lib/stripe/client.ts`)

```typescript
import { loadStripe } from '@stripe/stripe-js';
// in the frontend, use the publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default stripePromise;
```



## Critical Bugs and Issues to Avoid

1. **Quantity Bug**: In the checkout session creation, DO NOT set `quantity` if using usage-based subscriptions. The current implementation correctly omits this and includes a comment explaining why.

2. **Fallback User ID Resolution**: If the `user_id` is missing from subscription metadata, the implementation includes a fallback mechanism to find the user by email address.

3. Update your middleware to allow subscription pages and webhook endpoints without authentication:

```typescript
// In lib/supabase/middleware.ts
!request.nextUrl.pathname.startsWith("/subscriptions") &&
!request.nextUrl.pathname.startsWith("/api/webhook")
```


## Stripe Dashboard Setup for Manual setup

1. Create a product in Stripe Dashboard
2. Set up a recurring price with a lookup key (e.g., `your-app-monthly`)
3. Set up a usage meter


## Testing Checklist

### Pre-Testing Setup
- [ ] Stripe CLI installed and logged in
- [ ] Environment variables configured (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Supabase middleware excludes webhook endpoints
- [ ] Price lookup key updated in subscribe button
- [ ] Customers table exists in Supabase

### Testing Flow
1. Start your Next.js development server: `npm run dev`
2. Start Stripe CLI webhook listener: `stripe listen --forward-to http://localhost:3000/api/webhook/stripe`
3. Copy the webhook signing secret from CLI output to your `.env.local`
4. Test credit card details: 4242424242424242. CVC is any 3 digits. Date is any future date.
5. Monitor both your application logs and Stripe CLI output for debugging

For step 2&3, for production, you just need to set up the webhook endpoint in stripe portal (/api/webhook/stripe). Step 2&3 is needed for local just because Stripe can't reach your local via a publicly accessbile endpoint.



## Additional Notes

- This implementation uses Supabase for authentication
- The integration follows Next.js App Router patterns
- All components use TypeScript with proper type safety
- Error handling is implemented at multiple levels
- The design uses Tailwind CSS and Shadcn UI components
