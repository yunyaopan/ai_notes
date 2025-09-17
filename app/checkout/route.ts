import { Checkout } from '@dodopayments/nextjs';

const env =
  process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ||
  process.env.DODO_PAYMENTS_ENVIRONMENT === 'test_mode'
    ? (process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode')
    : undefined;

export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: env,
  type: 'static',
});

export const POST = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: env,
  type: 'session',
});


