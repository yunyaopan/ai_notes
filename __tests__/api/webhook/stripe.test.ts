import { NextRequest } from 'next/server';

// Mock Stripe webhook payload for testing
const mockSubscriptionCreated = {
  id: 'sub_test_123',
  object: 'subscription',
  status: 'trialing',
  customer: 'cus_test_123',
  metadata: {
    userId: 'user_test_123',
    userEmail: 'test@example.com'
  }
};

const mockSubscriptionDeleted = {
  id: 'sub_test_123',
  object: 'subscription',
  status: 'canceled',
  customer: 'cus_test_123',
  cancel_at_period_end: false
};

const mockTrialWillEnd = {
  id: 'sub_test_123',
  object: 'subscription',
  status: 'trialing',
  customer: 'cus_test_123',
  trial_end: Math.floor(Date.now() / 1000) + 259200 // 3 days from now
};

// Mock Stripe customer
const mockStripeCustomer = {
  id: 'cus_test_123',
  email: 'test@example.com',
  object: 'customer'
};

// Mock database functions
const mockDatabaseFunctions = {
  getCustomerByStripeId: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomerSubscriptionStatus: jest.fn(),
  updateUserSubscriptionMetadata: jest.fn()
};

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    admin: {
      listUsers: jest.fn().mockResolvedValue({
        data: {
          users: [{
            id: 'user_test_123',
            email: 'test@example.com'
          }]
        }
      })
    }
  }
};

describe('Stripe Webhook Handler', () => {
  let mockStripe: any;
  let mockConstructEvent: jest.Mock;
  let mockCustomersRetrieve: jest.Mock;

  beforeEach(() => {
    // Mock environment variables
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Stripe SDK
    mockConstructEvent = jest.fn();
    mockCustomersRetrieve = jest.fn();
    
    mockStripe = {
      webhooks: {
        constructEvent: mockConstructEvent
      },
      customers: {
        retrieve: mockCustomersRetrieve
      }
    };

    // Mock the Stripe module
    jest.doMock('@/lib/stripe/server', () => ({
      stripe: mockStripe
    }));

    // Mock database operations
    jest.doMock('@/lib/api/database', () => mockDatabaseFunctions);

    // Mock Supabase client
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue(mockSupabaseClient)
    }));
  });

  it('should handle customer.subscription.created event', async () => {
    // Setup mocks for subscription created event
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: mockSubscriptionCreated }
    });
    mockCustomersRetrieve.mockResolvedValue(mockStripeCustomer);
    mockDatabaseFunctions.getCustomerByStripeId.mockResolvedValue(null);
    mockDatabaseFunctions.createCustomer.mockResolvedValue({
      id: 'customer_123',
      stripe_customer_id: 'cus_test_123',
      subscription_status: 'trialing',
      email: 'test@example.com',
      user_id: 'user_test_123'
    });

    const { POST } = await import('../../app/api/webhook/stripe/route');
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockSubscriptionCreated),
      headers: {
        'stripe-signature': 'test_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockDatabaseFunctions.createCustomer).toHaveBeenCalledWith({
      stripe_customer_id: 'cus_test_123',
      subscription_status: 'trialing',
      email: 'test@example.com',
      user_id: 'user_test_123'
    });
  });

  it('should handle customer.subscription.deleted event (trial cancellation)', async () => {
    // Setup mocks for subscription deleted event
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: mockSubscriptionDeleted }
    });
    mockDatabaseFunctions.getCustomerByStripeId.mockResolvedValue({
      id: 'customer_123',
      stripe_customer_id: 'cus_test_123',
      subscription_status: 'trialing',
      email: 'test@example.com',
      user_id: 'user_test_123'
    });

    const { POST } = await import('../../app/api/webhook/stripe/route');
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockSubscriptionDeleted),
      headers: {
        'stripe-signature': 'test_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockDatabaseFunctions.updateCustomerSubscriptionStatus).toHaveBeenCalledWith('cus_test_123', 'canceled');
    expect(mockDatabaseFunctions.updateUserSubscriptionMetadata).toHaveBeenCalledWith('user_test_123', 'canceled');
  });

  it('should handle customer.subscription.trial_will_end event', async () => {
    // Setup mocks for trial will end event
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.trial_will_end',
      data: { object: mockTrialWillEnd }
    });
    mockDatabaseFunctions.getCustomerByStripeId.mockResolvedValue({
      id: 'customer_123',
      stripe_customer_id: 'cus_test_123',
      subscription_status: 'trialing',
      email: 'test@example.com',
      user_id: 'user_test_123'
    });

    const { POST } = await import('../../app/api/webhook/stripe/route');
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockTrialWillEnd),
      headers: {
        'stripe-signature': 'test_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    // The trial_will_end handler should log the event but not update database
    expect(mockDatabaseFunctions.updateCustomerSubscriptionStatus).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const { POST } = await import('../../app/api/webhook/stripe/route');
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockSubscriptionCreated),
      headers: {
        'stripe-signature': 'invalid_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 500 for webhook processing error', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: mockSubscriptionCreated }
    });
    mockDatabaseFunctions.createCustomer.mockRejectedValue(new Error('Database error'));

    const { POST } = await import('../../app/api/webhook/stripe/route');
    const request = new NextRequest('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      body: JSON.stringify(mockSubscriptionCreated),
      headers: {
        'stripe-signature': 'test_signature'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
