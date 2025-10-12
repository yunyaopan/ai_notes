'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lookup_key: 'mindsort-pro-monthly'
        }),
      });

      const data = await response.json();
      
      if (data.sessionId) {
        // Redirect to Stripe Checkout using the session URL
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Processing...' : 'Subscribe'}
    </Button>
  );
}
