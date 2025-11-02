import { Navigation } from '@/components/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureSubscription, getSubscriptionStatus, isSubscriptionOn } from '@/lib/api/subscription';
import { CustomerPortalButton } from '@/components/customer-portal-button';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // State 1: Unauthenticated users - show pricing and Start Trial button
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Pricing</h1>
            <p className="text-lg text-muted-foreground">
              Start your 90-day free trial today
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                <div className="text-3xl font-bold">$9.99</div>
                <div className="text-muted-foreground">per month</div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    <span className="text-foreground">90-day free trial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    <span className="text-foreground">Unlimited text categorization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    <span className="text-foreground">Advanced AI features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    <span className="text-foreground">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    <span className="text-foreground">Export capabilities</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/sign-up">Start Trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  // States 2 & 3: Authenticated users
  // Ensure subscription exists (creates one if first time accessing)
  await ensureSubscription(user);
  
  const subscriptionStatus = await getSubscriptionStatus(user);
  const hasAccess = await isSubscriptionOn(user);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Pricing</h1>
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
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <div className="text-3xl font-bold">$9.99</div>
              <div className="text-muted-foreground">per month</div>
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
                  
                  <CustomerPortalButton className="w-full" subscriptionStatus={subscriptionStatus}>
                    Manage Subscription
                  </CustomerPortalButton>
                </>
              ) : (
                // Inactive subscription - show pricing and reactivate button
                <>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-foreground">✓</span>
                      <span className="text-foreground">Unlimited text categorization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-foreground">✓</span>
                      <span className="text-foreground">Advanced AI features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-foreground">✓</span>
                      <span className="text-foreground">Priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-foreground">✓</span>
                      <span className="text-foreground">Export capabilities</span>
                    </li>
                  </ul>
                  
                  <div>
                    <div className="text-lg font-medium capitalize text-destructive">
                      Status: {subscriptionStatus}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Active subscription required to access protected features
                    </div>
                  </div>
                  
                  <CustomerPortalButton className="w-full" subscriptionStatus={subscriptionStatus}>
                    Manage Subscription
                  </CustomerPortalButton>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
