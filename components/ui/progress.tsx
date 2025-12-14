import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // Log progress component render
    React.useEffect(() => {
      console.log('[Progress Component] Render:', {
        value,
        max,
        percentage,
        calculated: `(${value} / ${max}) * 100 = ${percentage}%`,
        styleWidth: `${percentage}%`
      });
    }, [value, max, percentage]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          data-progress-value={percentage}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };

