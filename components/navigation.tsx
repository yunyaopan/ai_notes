import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-4 sm:px-5 text-sm">
        <div className="flex gap-3 sm:gap-5 items-center font-semibold">
          <Link href={"/"} className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MindSort
          </Link>
          <div className="flex gap-2 sm:gap-3">
            <Link href={"/protected"} className="text-xs sm:text-sm hover:underline">
              Write
            </Link>
            <Link href={"/subscriptions"} className="text-xs sm:text-sm hover:underline">
              Subscriptions
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-xs sm:text-sm hover:underline focus:outline-none">
                Free Tools
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href={"/fade"}>Feel & Let Go</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
      </div>
    </nav>
  );
}
