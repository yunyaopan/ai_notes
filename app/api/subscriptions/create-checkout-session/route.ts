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
          price: 'price_1SKFb8Jn2qf03jwiNrxmKt5h', // Pro plan price
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/subscriptions/success`,
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
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
