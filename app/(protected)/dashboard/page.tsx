// "use client";

import React from "react";
import  WelcomeSection  from "@/components/dashboard/welcome-section";
import { NextSessionCard } from "@/components/dashboard/next-session-card";
import { YourProgressSection } from "@/components/dashboard/your-progress-section";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  return (
    <div className="">
      <WelcomeSection />
      <NextSessionCard />
      <YourProgressSection />
    </div>
  );
}
