import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { getCustomerByUserId } from '@/lib/api/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return NextResponse.json({ error: 'STRIPE_PRICE_ID environment variable is not configured' }, { status: 500 });
    }

    // Get existing customer
    const customer = await getCustomerByUserId(user.id);
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create checkout session for resubscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/pricing`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      customer: customer.stripe_customer_id, // Use existing customer
      subscription_data: {
        metadata: {
          userId: user.id,
          userEmail: user.email!,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      checkoutUrl: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
