import { Navigation } from '@/components/navigation';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ensureSubscription, getSubscriptionStatus, isSubscriptionOn } from '@/lib/api/subscription';
import { CustomerPortalButton } from '@/components/customer-portal-button';

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  // Ensure subscription exists (creates one if first time accessing)
  await ensureSubscription(user);
  
  const subscriptionStatus = await getSubscriptionStatus(user);
  const hasAccess = await isSubscriptionOn(user);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {hasAccess ? 'Manage Subscription' : 'Subscription Required'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {hasAccess 
              ? 'Manage your subscription and billing information'
              : 'Get unlimited access to all features'
            }
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            {hasAccess ? (
              // Active subscription - show status and manage button
              <>
                <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
                <div className="mb-4">
                  <div className="text-lg font-medium capitalize">
                    Status: {subscriptionStatus === 'trialing' ? 'Active - Trial' : 'Active'}
                  </div>
                  {subscriptionStatus === 'trialing' && (
                    <div className="text-sm text-muted-foreground mt-1">
                      90-day trial period
                    </div>
                  )}
                </div>
                
                <CustomerPortalButton className="w-full">
                  Manage Subscription
                </CustomerPortalButton>
              </>
            ) : (
              // Inactive subscription - show status and reactivate button
              <>
                <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
                <div className="mb-4">
                  <div className="text-lg font-medium capitalize text-red-600">
                    Status: {subscriptionStatus}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Active subscription required to access protected features
                  </div>
                </div>
                
                <CustomerPortalButton className="w-full">
                  Manage Subscription
                </CustomerPortalButton>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
