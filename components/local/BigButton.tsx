// components/ui/BigButton.tsx: Custom large button
// Extends shadcn Button with bigger size, high contrast

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BigButton(props: any) {
  return <Button {...props} className={cn("text-xl h-16", props.className)} />;
}