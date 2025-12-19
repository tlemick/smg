import * as React from "react";
import { cn } from "@/lib/utils";

interface RhythmContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The number of baseline units (4px chunks) for padding.
   * e.g., spacing={4} results in 16px visual space (15px padding + 1px border).
   */
  spacing?: number; 
  hasBorder?: boolean;
}

const RhythmContainer = React.forwardRef<HTMLDivElement, RhythmContainerProps>(
  ({ className, spacing = 4, hasBorder = true, style, ...props }, ref) => {
    
    // 1 unit = 0.25rem (4px). 
    // We subtract 1px from the padding to accommodate the border.
    const paddingStyle = hasBorder
      ? {
          paddingTop: `calc(${spacing * 0.25}rem - 1px)`,
          paddingBottom: `calc(${spacing * 0.25}rem - 1px)`,
          paddingLeft: `calc(${spacing * 0.25}rem - 1px)`,
          paddingRight: `calc(${spacing * 0.25}rem - 1px)`,
        }
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-lg",
          hasBorder ? "border border-border" : "",
          className
        )}
        style={{ ...paddingStyle, ...style }}
        {...props}
      />
    );
  }
);
RhythmContainer.displayName = "RhythmContainer";

export { RhythmContainer };