## styling
refer to: https://ui.shadcn.com/blocks/login

## responsiveness in the login form
useFormStatus hook
1. User submits → form calls loginAction (server action).
2. React automatically sets pending = true while the action runs.
3. FormInputs and SubmitButton read pending from useFormStatus().
4. Components react: spinner shows, button/inputs disable.
5. Server action completes → React sets pending = false.
6. UI updates (or redirect happens).


## google login
https://supabase.com/docs/guides/auth/social-login/auth-google#signing-users-in
Supabase uses a "sign in or sign up" model for OAuth providers — it doesn't distinguish between the two. The first time a user logs in with Google, they're signed up. On subsequent logins, they're just signed in.

## Issue 1: Multiple Stripe Customers with Google Sign-in (Fixed)

**Problem:**
When users signed in with Google OAuth, multiple Stripe customers were being created for the same user due to a race condition in `ensureSubscription()`.

**Root Cause:**
- Multiple pages/components call `ensureSubscription()` simultaneously on first login
- All calls check for existing customer at nearly the same time
- All find `null` (no customer exists yet)
- All proceed to create separate Stripe customers
- Result: Multiple Stripe customers for the same email/user

The check-then-create pattern was not atomic — there was a time gap between checking and creating.

**Fix:**
1. **Database Constraint:** Added unique constraint on `customers.user_id` to ensure only one customer record per user at the database level.
2. **Idempotent Customer Creation:** Updated `ensureSubscription()` to:
   - Check for existing Stripe customers by email before creating new ones
   - Check for existing subscriptions before creating new ones
   - Handle unique constraint violations gracefully (catch PostgreSQL error code 23505)
   - Update metadata when reusing existing resources

**Key Implementation:**
- Checks `stripe.customers.list({ email })` before creating new Stripe customer
- Catches database unique constraint violations and fetches existing customer
- Updates Stripe customer/subscription metadata if `userId` is missing

**Files Modified:**
- `migrations/add_customers_user_id_unique_constraint.sql` (new)
- `lib/api/subscription.ts` (updated `ensureSubscription()`)
- `lib/api/database.ts` (updated `createCustomer()`)
