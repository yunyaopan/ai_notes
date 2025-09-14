import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navigation } from "@/components/navigation";
import RandomBlobGenerator from "@/components/random-blob-generator";

export default function FadePage() {
  return (
    <main className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navigation />
        <div className="flex-1 flex flex-col gap-6 sm:gap-8 max-w-5xl p-4 sm:p-5">
          <div className="flex flex-col items-center gap-2 sm:gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-center">Feel & Let Go</h1>
            <p className="text-muted-foreground text-center max-w-2xl px-4">
            This tool is designed to help you visualize your emotions or thoughts as a dynamic, colorful blob. By seeing it take shape, you can acknowledge the feeling in the moment. When you’re ready, click Fade Away to watch it shrink and dissolve, symbolizing the release of that emotion or thought. This process encourages mindfulness, helping you recognize and let go, one breath at a time.
            </p>
          </div>
          <RandomBlobGenerator />
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
