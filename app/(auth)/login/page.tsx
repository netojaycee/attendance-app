"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginData } from "@/lib/schema";
import { loginAction } from "@/lib/actions/auth.actions";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/local/submit-button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const toastShownRef = useRef(false);
  const mountedRef = useRef(false);

  console.log("Render Login Page,", searchParams.toString());

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    // Ensure component is mounted and hydrated before showing toast
    if (!mountedRef.current) {
      mountedRef.current = true;

      // Small delay to ensure Sonner Toaster is ready
      const timer = setTimeout(() => {
        // Read params from URL directly to ensure they're available
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        const email = params.get("email");

        // console.log("Toast check - error:", error, "email:", email, "shown:", toastShownRef.current);

        if (error === "account_not_found" && email && !toastShownRef.current) {
          toast.error(
            `Account not found for ${decodeURIComponent(email)}. Contact admin.`
          );
          toastShownRef.current = true;
          console.log("Toast shown");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  const onSubmit = async (data: LoginData) => {
    setIsPending(true);
    try {
      const result = await loginAction(data.email, data.password);
      
      if (result.success) {
        toast.success("Logged in successfully");
        // Cookie is set, now redirect to dashboard
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/v1/auth/google";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Choir Attendance</CardTitle>
          <CardDescription>Sign in to track rehearsals</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled={isPending}
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isPending}
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SubmitButton
                isPending={isPending}
                text="Sign in"
                loadingText="Signing in..."
              />

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full h-12 border-[#833CF6]/30 text-[#833CF6] flex items-center justify-center gap-2",
                  "hover:bg-[#833CF6]/10 hover:text-[#833CF6]"
                )}
                onClick={handleGoogleLogin}
                disabled={isPending}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  ></path>
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  ></path>
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  ></path>
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  ></path>
                </svg>
                Continue with Google
              </Button>

              {/* <p className="text-center text-sm text-muted-foreground pt-4">
                Need access? Contact your administrator.
              </p> */}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
