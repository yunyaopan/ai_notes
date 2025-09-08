import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import RandomBlobGenerator from "@/components/random-blob-generator";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function FadePage() {
  return (
    <main className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-4 sm:px-5 text-sm">
            <div className="flex gap-3 sm:gap-5 items-center font-semibold">
              <Link href={"/"}>Gooday</Link>
              <div className="flex gap-2 sm:gap-3">
                <Link href={"/protected"} className="text-xs sm:text-sm hover:underline">
                  write
                </Link>
                <Link href={"/fade"} className="text-xs sm:text-sm hover:underline">
                  feel
                </Link>
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-6 sm:gap-8 max-w-5xl p-4 sm:p-5">
          <div className="flex flex-col items-center gap-2 sm:gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-center">Feel & Let Go</h1>
            <p className="text-muted-foreground text-center max-w-2xl px-4">
            See your feelings take shape, then gently let them go.
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
