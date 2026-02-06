
import { getCurrentUserAction } from "@/lib/actions/auth.actions";
import { notFound } from "next/navigation";

export default async function WelcomeSection() {
  // const { user, isInitialized, isLoading } = useAuthStore();

  // // Show loading skeleton while initializing
  // if (isLoading || !isInitialized) {
  //   return (
  //     <div className="px-4 pb-2 space-y-2">
  //       <Skeleton className="h-8 w-48 rounded" />
  //       <Skeleton className="h-4 w-32 rounded" />
  //     </div>
  //   );
  // }

  const result = await getCurrentUserAction();
  
  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;

  const firstName = user?.firstName || "Guest";
  const lastName = user?.lastName || "";
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();

    // Check if there's an upcoming event today
    // For now, return a generic message based on time of day
    if (hour < 12) {
      return "Good morning! 🌅";
    } else if (hour < 17) {
      return "Good afternoon! ☀️";
    } else {
      return "Good evening! 🌙";
    }
  };

  return (
    <div className="px-4 pb-2">
      <h1 className="text-2xl font-bold text-foreground">
        Hello, {displayName}! 👋
      </h1>
      <p className="text-sm text-text-secondary">{getWelcomeMessage()}</p>
    </div>
  );
}
