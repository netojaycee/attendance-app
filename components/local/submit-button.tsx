"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/local/loader";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends Omit<any, "type" | "disabled"> {
  /**
   * Whether the form is submitting
   */
  isPending: boolean;

  /**
   * Button text to display
   */
  text: string;

  /**
   * Optional additional className
   */
  className?: string;

  /**
   * Optional loading text (defaults to no text, just loader)
   * @default undefined (no text)
   */
  loadingText?: string;
}

export function SubmitButton({
  isPending,
  text,
  className,
  loadingText,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className={cn(
        "w-full h-12 text-base font-medium",
        "bg-[#833CF6] hover:bg-[#6d28d9] text-white",
        className
      )}
      {...props}
    >
      {isPending ? (
        loadingText ? (
          <span className="flex items-center gap-2">
            <Loader size="sm" showText={false} />
            <span className="animate-pulse">{loadingText}</span>
          </span>
        ) : (
          <Loader size="sm" showText={false} />
        )
      ) : (
        text
      )}
    </Button>
  );
}
