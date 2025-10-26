import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Configure Stripe to use Fetch API for Cloudflare Workers compatibility
// This is required because Cloudflare Workers don't fully support Node.js HTTP APIs
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  httpClient: Stripe.createFetchHttpClient(),
});
