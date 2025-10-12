import { Brain, Target, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      {/* Main Hero Section */}
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Organize Your Thoughts with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MindSort
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Dump your thoughts, get instant AI categorization, and focus on what matters most with priority sorting.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/protected">
              Start Writing
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

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-3 gap-8 w-full max-w-4xl">
        <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold">AI Auto-Categorize</h3>
          <p className="text-muted-foreground">
            Write anything and watch AI instantly organize your thoughts into meaningful categories like Ideas, Concerns, and Insights.
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
          <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Target className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Smart Priority Sorting</h3>
          <p className="text-muted-foreground">
            Focus on what matters most. Sort thoughts by importance within each category to tackle the right things first.
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
          <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <Star className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold">Star & Pin System</h3>
          <p className="text-muted-foreground">
            Mark important thoughts with stars and pin critical items to the top. Never lose track of what&apos;s essential.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="w-full max-w-4xl space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <h3 className="text-xl font-semibold">Write Your Thoughts</h3>
            <p className="text-muted-foreground">
              Simply dump all your thoughts, ideas, concerns, and insights into our text area. No need to organize as you write.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <h3 className="text-xl font-semibold">AI Categorizes Instantly</h3>
            <p className="text-muted-foreground">
              Our AI analyzes your text and automatically sorts it into categories like Ideas, Concerns, Insights, and more.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <h3 className="text-xl font-semibold">Focus on What Matters</h3>
            <p className="text-muted-foreground">
              Review each category, set priorities, star important items, and take action on the most critical thoughts first.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
