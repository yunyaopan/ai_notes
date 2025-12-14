"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      classNames={{
        root: defaultClassNames.root,
        months: cn(defaultClassNames.months, "flex flex-col sm:flex-row gap-4"),
        month: cn(defaultClassNames.month, ""),
        month_caption: cn(
          defaultClassNames.month_caption,
          "flex justify-center pt-1 relative items-center"
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          "text-sm font-medium"
        ),
        nav: cn(defaultClassNames.nav, "space-x-1 flex items-center"),
        button_previous: cn(
          defaultClassNames.button_previous,
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        button_next: cn(
          defaultClassNames.button_next,
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        weekdays: cn(defaultClassNames.weekdays, "flex"),
        weekday: cn(
          defaultClassNames.weekday,
          "flex-1 text-center text-xs font-medium text-muted-foreground h-9 flex items-center justify-center"
        ),
        week: cn(defaultClassNames.week, "flex w-full"),
        day: cn(
          defaultClassNames.day,
          "flex-1 h-9 p-0 relative text-center text-sm [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
        ),
        day_button: cn(
          defaultClassNames.day_button,
          buttonVariants({ variant: "ghost" }),
          "h-9 w-full p-0 font-normal aria-selected:opacity-100"
        ),
        range_end: cn(defaultClassNames.range_end, "day-range-end"),
        selected: cn(
          defaultClassNames.selected,
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
        ),
        today: cn(defaultClassNames.today, "bg-accent text-accent-foreground"),
        outside: cn(
          defaultClassNames.outside,
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30"
        ),
        disabled: cn(
          defaultClassNames.disabled,
          "text-muted-foreground opacity-50"
        ),
        range_middle: cn(
          defaultClassNames.range_middle,
          "aria-selected:bg-accent aria-selected:text-accent-foreground"
        ),
        hidden: cn(defaultClassNames.hidden, "invisible"),
        ...classNames,
      }}
      className={cn("p-3", className)}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
