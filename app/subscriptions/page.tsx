import { Navigation } from '@/components/navigation';
import { SubscribeButton } from '@/components/subscribe-button';

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Subscribe to MindSort Pro</h1>
          <p className="text-lg text-muted-foreground">
            Get unlimited access to all features
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Pro Plan</h2>
            <div className="text-3xl font-bold mb-2">$9.99</div>
            <div className="text-muted-foreground mb-6">per month</div>
            
            <ul className="space-y-2 mb-6">
              <li>✓ Unlimited text categorization</li>
              <li>✓ Advanced AI features</li>
              <li>✓ Priority support</li>
              <li>✓ Export capabilities</li>
            </ul>

            <SubscribeButton />
          </div>
        </div>
      </main>
    </div>
  );
}
