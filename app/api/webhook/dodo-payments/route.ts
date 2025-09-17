import { Webhooks } from '@dodopayments/nextjs';

export const POST = Webhooks({
  webhookKey: process.env.DODO_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log('Dodo webhook payload received:', payload?.type || 'unknown');
  },
  onPaymentSucceeded: async (payload) => {
    console.log('Payment succeeded payload:', JSON.stringify(payload?.data));
  },
  onSubscriptionActive: async (payload) => {
    console.log('Subscription active payload:', JSON.stringify(payload?.data));
  },
});


