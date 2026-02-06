"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  /**
   * Size of the loader: 'sm' | 'md' | 'lg'
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Show loading text
   * @default true
   */
  showText?: boolean;
  
  /**
   * Custom loading text
   * @default 'Loading...'
   */
  text?: string;
  
  /**
   * Full screen overlay
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Additional className
   */
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const borderWidthMap = {
  sm: "border-3",
  md: "border-4",
  lg: "border-4",
};

export function Loader({
  size = "md",
  showText = true,
  text = "Loading...",
  fullScreen = false,
  className,
}: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      {/* Animated spinner */}
      <div className={cn("relative", sizeMap[size])}>
        {/* Outer ring */}
        <div
          className={cn(
            "absolute inset-0 border-transparent border-t-[#833CF6] border-r-[#833CF6] rounded-full animate-spin",
            borderWidthMap[size]
          )}
        ></div>

        {/* Middle ring (counter-rotating) */}
        <div
          className={cn(
            "absolute inset-1 border-transparent border-b-[#10B981] rounded-full animate-spin-reverse",
            size === "sm" ? "border-2" : size === "md" ? "border-3" : "border-4"
          )}
        ></div>

        {/* Center dot */}
        <div className="absolute inset-2 bg-linear-to-br from-[#833CF6] to-[#10B981] rounded-full"></div>
      </div>

      {/* Loading text */}
      {showText && (
        <p className="text-sm font-medium text-text-primary animate-pulse">
          {text}
        </p>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        :global(.animate-spin-reverse) {
          animation: spin-reverse 2s linear infinite;
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return <div className={cn("flex items-center justify-center", className)}>{content}</div>;
}
