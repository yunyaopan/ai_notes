import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navigation />
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          
          {/* Benefits Section */}
          <div className="w-full max-w-4xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Why Gooday?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop losing important thoughts in endless notes. Get organized, stay focused, and take action on what truly matters.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">🧠 Mental Clarity</h3>
                <p className="text-muted-foreground">
                  Clear your mind by dumping all thoughts without worrying about organization. Let AI handle the sorting while you focus on thinking.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">🎯 Actionable Focus</h3>
                <p className="text-muted-foreground">
                  Transform scattered thoughts into actionable priorities. See what needs attention most and tackle it systematically.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">⚡ Instant Organization</h3>
                <p className="text-muted-foreground">
                  No more manual categorization. AI instantly sorts your thoughts into meaningful categories like Ideas, Concerns, and Insights.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">💫 Never Lose Important Thoughts</h3>
                <p className="text-muted-foreground">
                  Star important items, pin critical thoughts, and filter by category. Your most valuable insights are always within reach.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="w-full max-w-2xl text-center space-y-6 p-8 rounded-lg border bg-card">
            <h2 className="text-2xl font-bold">Ready to organize your thoughts?</h2>
            <p className="text-muted-foreground">
              Join thousands who&apos;ve transformed their thinking process with AI-powered organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/protected">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/fade">
                  Try Feel & Let Go
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
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
