import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Category color variants
        "category-amber":
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white",
        "category-green":
          "border-transparent bg-green-100 text-green-800 dark:bg-green-600 dark:text-white",
        "category-yellow":
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white",
        "category-red":
          "border-transparent bg-red-100 text-red-800 dark:bg-red-600 dark:text-white",
        "category-orange":
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-white",
        "category-pink":
          "border-transparent bg-pink-100 text-pink-800 dark:bg-pink-600 dark:text-white",
        "category-indigo":
          "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-white",
        "category-gray":
          "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
