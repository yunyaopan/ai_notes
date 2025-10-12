import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUsage } from '@/lib/api/usage';
import { getCustomerByUserId } from '@/lib/api/database';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer record
    const customer = await getCustomerByUserId(user.id);
    
    if (!customer) {
      return NextResponse.json({ 
        hasSubscription: false,
        subscriptionStatus: 'none',
        usage: null 
      });
    }

    // Get current usage
    const usage = await getCurrentUsage(user.id);

    return NextResponse.json({
      hasSubscription: true,
      subscriptionStatus: customer.subscription_status,
      usage: usage,
      customer: {
        id: customer.id,
        stripe_customer_id: customer.stripe_customer_id,
        email: customer.email,
        created_at: customer.created_at,
      }
    });
  } catch (error) {
    console.error('Usage status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage status' },
      { status: 500 }
    );
  }
}
