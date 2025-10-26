import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserDropdown } from "./user-dropdown";
import { getSubscriptionStatus } from "@/lib/api/subscription";

export async function AuthButton() {
  const supabase = await createClient();

  // Get the actual user object instead of claims
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Get subscription status for the user dropdown
    const subscriptionStatus = await getSubscriptionStatus(user);
    
    return (
      <UserDropdown 
        userEmail={user.email || ''} 
        subscriptionStatus={subscriptionStatus}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
