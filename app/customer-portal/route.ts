import { CustomerPortal } from '@dodopayments/nextjs';

const env =
  process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ||
  process.env.DODO_PAYMENTS_ENVIRONMENT === 'test_mode'
    ? (process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode')
    : 'test_mode';

export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: env,
});


