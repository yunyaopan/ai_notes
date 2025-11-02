import { Navigation } from '@/components/navigation';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ensureSubscription, getSubscriptionStatus, isSubscriptionOn } from '@/lib/api/subscription';
import { CustomerPortalButton } from '@/components/customer-portal-button';
import { getUserNoteCount } from '@/lib/api/database';
import { SubscriptionsClient } from './subscriptions-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  const params = await searchParams;
  
  // Ensure subscription exists (creates one if first time accessing)
  await ensureSubscription(user);
  
  const subscriptionStatus = await getSubscriptionStatus(user);
  const hasAccess = await isSubscriptionOn(user);
  const noteCount = await getUserNoteCount(user.id);
  const showTrialMessage = params.error === 'subscription_required';

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
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {hasAccess ? 'Current Subscription' : 'Subscription Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasAccess ? (
                // Active subscription - show status and manage button
                <>
                  <div>
                    <div className="text-lg font-medium capitalize text-foreground">
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
                  <div>
                    <div className="text-lg font-medium capitalize text-destructive">
                      Status: {subscriptionStatus}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Active subscription required to access protected features
                    </div>
                  </div>
                  
                  {showTrialMessage && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        During your trial period, you have accumulated <strong>{noteCount}</strong> note{noteCount !== 1 ? 's' : ''} with MindSort.
                      </p>
                    </div>
                  )}
                  
                  {showTrialMessage ? (
                    <SubscriptionsClient />
                  ) : (
                    <CustomerPortalButton className="w-full">
                      Manage Subscription
                    </CustomerPortalButton>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
