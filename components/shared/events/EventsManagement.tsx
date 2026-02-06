import React from "react";
import EventsManagementClient from "./EventsManagementClient";
import { notFound } from "next/navigation";
import { getEventsAction } from "@/lib/actions/events.actions";

export default async function EventsManagement() {
  const result = await getEventsAction();

  if (!result.success || !result.data) {
    notFound();
  }

  const events = result.data;
  return <EventsManagementClient initialEvents={events} />;
}
