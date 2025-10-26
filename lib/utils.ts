import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

/**
 * Get the base URL for the application.
 * Uses NEXT_PUBLIC_SITE_URL if available, otherwise constructs from VERCEL_URL,
 * or defaults to localhost for development.
 */
export function getBaseUrl(): string {
  // Check for explicit site URL first
  if (typeof window !== "undefined") {
    // Client-side: use NEXT_PUBLIC_SITE_URL if set, otherwise use current origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      return siteUrl;
    }
    // Fallback to current origin for client-side
    return window.location.origin;
  }
  
  // Server-side: use NEXT_PUBLIC_SITE_URL if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback to VERCEL_URL or localhost
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return "http://localhost:3000";
}
