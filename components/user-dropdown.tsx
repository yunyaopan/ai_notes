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
}

export function UserDropdown({ userEmail }: UserDropdownProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleCustomerPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe-hosted customer portal
        window.location.href = data.url; // ← This is where the redirect happens
      } else {
        console.error('No portal URL received');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
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
        <DropdownMenuItem onClick={handleCustomerPortal} className="cursor-pointer" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Manage Subscription'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
