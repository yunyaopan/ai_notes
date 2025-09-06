import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import RandomBlobGenerator from "@/components/random-blob-generator";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function FadePage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Gooday</Link>
              <div className="flex gap-3">
                <Link href={"/protected"} className="text-sm hover:underline">
                  write
                </Link>
                <Link href={"/fade"} className="text-sm hover:underline">
                  feel
                </Link>
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col items-center gap-8">
            <h1 className="font-bold text-4xl">Feel & Let Go</h1>
            <p className="text-muted-foreground text-center max-w-2xl">
            See your feelings take shape, then gently let them go.
            </p>
          </div>
          <RandomBlobGenerator />
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
