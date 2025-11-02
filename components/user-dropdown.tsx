"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface UserDropdownProps {
  userEmail: string;
  subscriptionStatus?: string;
}

export function UserDropdown({ userEmail, subscriptionStatus }: UserDropdownProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // If subscription is canceled, redirect to checkout for resubscription
      if (subscriptionStatus === 'canceled') {
        const response = await fetch('/api/subscriptions/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.checkoutUrl) {
          // Redirect to Stripe Checkout for resubscription
          window.location.href = data.checkoutUrl;
        } else {
          console.error('No checkout URL received');
        }
      } else {
        // For active trial or incomplete subscription, open billing portal
        const response = await fetch('/api/customer-portal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe-hosted customer portal
          window.location.href = data.url;
        } else {
          console.error('No portal URL received');
        }
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
          <span className="text-sm">Hey, {userEmail}!</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Manage Subscription'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
