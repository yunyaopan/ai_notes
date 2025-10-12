import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock Stripe webhook payload for testing
const mockCheckoutSessionCompleted = {
  id: 'cs_test_123',
  object: 'checkout.session',
  mode: 'subscription',
  customer: 'cus_test_123',
  metadata: {
    userId: 'user_test_123',
    userEmail: 'test@example.com'
  }
};

const mockSubscriptionCreated = {
  id: 'sub_test_123',
  object: 'subscription',
  status: 'active',
  customer: 'cus_test_123'
};

// Mock Stripe customer
const mockStripeCustomer = {
  id: 'cus_test_123',
  email: 'test@example.com',
  object: 'customer'
};

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    
    // Mock Stripe SDK
    jest.mock('@/lib/stripe/server', () => ({
      stripe: {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: mockCheckoutSessionCompleted }
          })
        },
        customers: {
          retrieve: jest.fn().mockResolvedValue(mockStripeCustomer)
        }
      }
    }));
    
    // Mock database operations
    jest.mock('@/lib/api/database', () => ({
      getCustomerByStripeId: jest.fn().mockResolvedValue(null),
      createCustomer: jest.fn().mockResolvedValue({
        id: 'customer_123',
        stripe_customer_id: 'cus_test_123',
        subscription_status: 'active',
        email: 'test@example.com',
        user_id: 'user_test_123'
      })
    }));
  });

  it('should handle checkout.session.completed event', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutSessionCompleted),
      headers: {
        'stripe-signature': 'test_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should handle customer.subscription.created event', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockSubscriptionCreated),
      headers: {
        'stripe-signature': 'test_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should return 400 for missing signature', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutSessionCompleted)
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
