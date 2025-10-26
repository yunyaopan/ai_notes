"use client";

import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function SubscriptionsClient() {
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);

  const handleStartSubscription = async () => {
    setIsLoadingSubscription(true);
    try {
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleDownloadCSV = async () => {
    setIsLoadingDownload(true);
    try {
      const response = await fetch('/api/chunks/export-csv');
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindsort-notes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download notes. Please try again.');
    } finally {
      setIsLoadingDownload(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={handleStartSubscription}
        disabled={isLoadingSubscription}
        className="w-full"
        size="lg"
      >
        {isLoadingSubscription ? 'Loading...' : 'Start Subscription'}
      </Button>
      
      <Button 
        onClick={handleDownloadCSV}
        disabled={isLoadingDownload}
        variant="outline"
        className="w-full"
        size="lg"
      >
        {isLoadingDownload ? 'Preparing download...' : 'Download my notes as CSV'}
      </Button>
    </div>
  );
}

