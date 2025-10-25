import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureSubscription, isSubscriptionOn } from "@/lib/api/subscription";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ensure subscription exists (creates one if first time accessing)
  await ensureSubscription(user);

  const hasAccess = await isSubscriptionOn(user);
  if (!hasAccess) {
    redirect("/subscriptions?error=subscription_required");
  }
  return (
    <main className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <div className="flex-1 w-full flex flex-col gap-12 sm:gap-20 items-center">
        <Navigation />
        <div className="flex-1 flex flex-col gap-8 sm:gap-20 w-full max-w-5xl p-4 sm:p-5">
          {children}
        </div>

        <footer className="w-full flex flex-col sm:flex-row items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-8 py-8 sm:py-16 px-4">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
