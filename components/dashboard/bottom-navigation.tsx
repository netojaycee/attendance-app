import { notFound } from "next/navigation";
import { getCurrentUserAction } from "@/lib/actions/auth.actions";
import { BottomNavigationClient } from "./bottom-navigation-client";

export async function BottomNavigation() {
  const result = await getCurrentUserAction();

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;

  return <BottomNavigationClient user={user} />;
}
