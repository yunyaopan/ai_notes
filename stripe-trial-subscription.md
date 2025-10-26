# Stripe Trial Subscription Implementation

## Overview

Automatically create Stripe customers and trial subscriptions when users verify their email. Store subscription_status in both the customers table and Supabase app_metadata. Protect API routes to only allow users with 'trialing' or 'active' status. Handle Stripe webhooks to keep subscription status in sync.

## Implementation Steps

### 1. Create Stripe Webhook Handler

**File:** `app/api/webhook/stripe/route.ts`

Handle three webhook events:

- `customer.subscription.created` - Create customer record with subscription_status
- `customer.subscription.updated` - Update subscription_status in customers table and app_metadata
- `customer.subscription.deleted` - Update subscription_status to 'canceled'

Key implementation details:

- Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- Extract `userId` from subscription metadata
- Update both customers table and Supabase user app_metadata
- Use existing database functions: `createCustomer()`, `updateCustomerSubscriptionStatus()`, `getCustomerByStripeId()`

### 2. Create Subscription on First Access

**File:** `lib/api/subscription.ts`

Create helper function `ensureSubscription(user)` that:

1. Checks if customer record exists for user
2. If no customer exists:

   - Create Stripe customer with user's email
   - Create Stripe subscription with:
     - Price ID: `price_1SKFb8Jn2qf03jwiNrxmKt5h`
     - Trial period: 90 days
     - Metadata: `{ userId: user.id, userEmail: user.email }`
   - Create customer record in database with `subscription_status: 'trialing'`
   - Update Supabase user app_metadata with `subscription_status: 'trialing'`

3. Return customer record

**Call this function in:**

- `app/protected/layout.tsx` - Before checking subscription access
- All protected API routes - Before checking subscription access

This approach works for:

- ✅ Email signup with verification
- ✅ Social login (Google, GitHub, etc.)
- ✅ Any future OAuth providers
- ✅ Handles race conditions (multiple simultaneous requests)

**Implementation pattern:**

```typescript
// In protected layout/routes
const customer = await ensureSubscription(user);
const hasAccess = await isSubscriptionOn(user);
if (!hasAccess) {
  redirect("/subscriptions?error=subscription_required");
}
```

### 3. Create Subscription Status Check Utility

**File:** `lib/api/subscription.ts`

Create two helper functions:

**`getSubscriptionStatus(user)`**:

- Reads `subscription_status` from user.app_metadata
- Returns the subscription status string (e.g., 'trialing', 'active', 'canceled', etc.)
- Fallback to customers table if app_metadata is missing

**`isSubscriptionOn(user)`**:

- Calls `getSubscriptionStatus(user)`
- Returns boolean: `true` if status is 'trialing' or 'active', `false` otherwise
- Used by all protected API routes and protected pages

### 4. Protect Pages and API Routes

#### A. Protect All `/protected/*` Pages

**File:** `app/protected/layout.tsx`

Add subscription check in the layout to protect all pages under `/protected/*`:

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect("/auth/login");
}

// Ensure subscription exists (creates one if first time accessing)
await ensureSubscription(user);

const hasAccess = await isSubscriptionOn(user);
if (!hasAccess) {
  redirect("/subscriptions?error=subscription_required");
}
```

This will protect:

- `/protected` (main page)
- `/protected/*` (any nested pages under protected)

#### B. Protect API Routes

**Files:**

- `app/api/categorize/route.ts`
- `app/api/chunks/route.ts`
- `app/api/chunks/[id]/route.ts`
- `app/api/chunks/pin/route.ts`
- `app/api/chunks/star/route.ts`
- `app/api/chunks/[id]/delete/route.ts`

Add subscription check after authentication:

```typescript
const hasAccess = await isSubscriptionOn(user);
if (!hasAccess) {
  return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
}
```

### 5. Update Database Functions

**File:** `lib/api/database.ts`

Add function to update user app_metadata:

```typescript
export async function updateUserSubscriptionMetadata(userId: string, subscriptionStatus: string)
```

This will use Supabase Admin API to update user's app_metadata.

### 6. Update Middleware Configuration

**File:** `middleware.ts`

Ensure webhook endpoint is excluded from auth middleware (already configured for `/api/webhook/`).

### 7. Create Subscription Required Page

**File:** `app/subscriptions/page.tsx`

Update the existing subscriptions page to show different UI based on subscription status:

**For users without active subscription (subscription_status is NOT 'trialing' or 'active'):**

- Display current subscription status (e.g., "Expired", "Canceled", "Past Due", "Incomplete")
- Clear message: "Active subscription required to access protected features"
- Button/Link to Customer Portal to reactivate or manage subscription
- If no customer record exists at all, show the subscribe button

**For users with active/trialing subscription:**

- Display current subscription status (e.g., "Active - Trial", "Active")
- Show trial end date if in trial period
- Link to Customer Portal to manage subscription

**Implementation:**

```typescript
export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  const customer = await getCustomerByUserId(user.id);
  const subscriptionStatus = getSubscriptionStatus(user);
  const hasAccess = await isSubscriptionOn(user);
  
  // Render different UI:
  // - No customer: Show subscribe button
  // - Inactive subscription: Show status + customer portal link
  // - Active subscription: Show status + customer portal link
}
```

This page serves as:

- Landing page when users are redirected from protected pages/APIs (when subscription is inactive)
- Subscription management hub for all users

### 8. Add Customer Portal Access

#### A. Create Customer Portal API Endpoint

**File:** `app/api/customer-portal/route.ts`

Create server-side endpoint to generate Stripe billing portal session:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { getCustomerByUserId } from '@/lib/api/database';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await getCustomerByUserId(user.id);
  
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${request.nextUrl.origin}/protected`,
  });

  return NextResponse.json({ url: session.url });
}
```

#### B. Update User Dropdown Component

**File:** `components/user-dropdown.tsx`

Add "Manage Subscription" menu item to the flyout menu:

```typescript
const handleCustomerPortal = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/customer-portal', {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Error accessing customer portal:', error);
  } finally {
    setIsLoading(false);
  }
};

// Add to dropdown menu:
<DropdownMenuItem onClick={handleCustomerPortal} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Manage Subscription'}
</DropdownMenuItem>
```

This allows users to:

- Update payment methods
- View billing history
- Cancel subscription
- Update billing information

All without re-authentication (handled server-side).

### 8. Environment Variables

Add to `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...  # For admin operations
```

## Key Files to Modify

- `app/auth/confirm/route.ts` - Add subscription creation
- `app/api/webhook/stripe/route.ts` - New file for webhooks
- `lib/api/subscription.ts` - New file for subscription utilities
- `lib/api/database.ts` - Add app_metadata update function
- All protected API routes - Add subscription checks


### 9. Create pricing page
- Start trial button should not lead to stripe's checkout session
- start trial button shall lead to my app's login/sign up page
- the pricing page should not be auth-protected


### 10. When trial ends without payment method
referece: https://docs.stripe.com/billing/subscriptions/trials?utm_source=chatgpt.com#create-free-trials-without-payment

Updated Subscription Creation (`lib/api/subscription.ts`)

Added `trial_settings.end_behavior.missing_payment_method: 'cancel'` to the subscription creation:

```typescript
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomer.id,
  items: [
    {
      price: 'price_1SKFb8Jn2qf03jwiNrxmKt5h',
    },
  ],
  trial_end: Math.floor(Date.now() / 1000) + 60,
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
```


## Manage Subscription Button Logic

The "Manage Subscription" button (found on pricing page and user dropdown menu) now handles different subscription states:

- **Active Trial/Incomplete Subscription**: Opens Stripe Billing Portal for payment management
- **Canceled Subscription**: Redirects to Stripe Checkout for resubscription

**Implementation Details:**
- Create `/api/subscriptions/create-checkout-session` endpoint for resubscription
- Updated `CustomerPortalButton` and `UserDropdown` components to check subscription status
- Modified `AuthButton` to pass subscription status to user dropdown

## Testing Checklist

1. Sign up new user and verify email
2. Check Stripe dashboard for customer and subscription
3. Verify customers table has correct subscription_status
4. Test protected API with trialing user (should work)
5. Use Stripe CLI to simulate subscription.updated event
6. Test protected API after trial expires (should fail)
7. Simulate subscription.deleted event and verify access revoked
8. Test manage subscription button with different subscription states