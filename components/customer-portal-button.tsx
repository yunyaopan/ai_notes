"use client";

import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CustomerPortalButtonProps {
  className?: string;
  children: React.ReactNode;
  subscriptionStatus?: string;
}

export function CustomerPortalButton({ className, children, subscriptionStatus }: CustomerPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // If subscription is canceled, redirect to checkout for resubscription
      if (subscriptionStatus === 'canceled') {
        const response = await fetch('/api/subscriptions/create-checkout-session', {
          method: 'POST',
        });
        const data = await response.json();
        
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        // For active trial or incomplete subscription, open billing portal
        const response = await fetch('/api/customer-portal', {
          method: 'POST',
        });
        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleManageSubscription}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  );
}
