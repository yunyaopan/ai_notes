import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for subscribing to MindSort Pro!
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Welcome to Pro!</h2>
            <p className="text-muted-foreground mb-6">
              Your subscription is now active. You can start enjoying all the premium features.
            </p>
            
            <div className="space-y-3">
              <Link href="/protected">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
