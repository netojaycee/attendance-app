// app/layout.tsx: Root layout component
// Wraps app with providers: Session, Zustand (via hook), Tailwind classes
// Includes global styles, dark mode support

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/local/theme-provider";
import { AuthInitializer } from "@/components/local/auth-initializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Choir Attendance App",
  description: "Simple attendance tracking for church choirs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {" "}
          <Providers>
            <AuthInitializer>{children}</AuthInitializer>
            <Toaster richColors closeButton />{" "}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
