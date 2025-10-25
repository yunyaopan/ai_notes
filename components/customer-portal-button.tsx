"use client";

import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CustomerPortalButtonProps {
  className?: string;
  children: React.ReactNode;
}

export function CustomerPortalButton({ className, children }: CustomerPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomerPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCustomerPortal}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  );
}
