import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { lookup_key } = await request.json();
    
    if (!lookup_key) {
      return NextResponse.json({ error: 'Lookup key is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the price using the lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [lookup_key],
      active: true,
    });

    if (prices.data.length === 0) {
      return NextResponse.json({ error: 'Price not found' }, { status: 404 });
    }

    const price = prices.data[0];

    // Create Stripe checkout session for usage-based billing
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
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
      },
      // Add subscription metadata that will be passed to the subscription
      subscription_data: {
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      checkoutUrl: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
