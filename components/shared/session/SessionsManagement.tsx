import React from "react";
import SessionsManagementClient from "./SessionsManagementClient";
import {
  getEventByIdentifierAction,
  getEventSessionsAction,
} from "@/lib/actions/events.actions";
import { notFound } from "next/navigation";

interface SessionsManagementProps {
  eventSlug: string;
}

export default async function SessionsManagement({
  eventSlug,
}: SessionsManagementProps) {
  // Fetch event by slug/identifier
  const eventResult = await getEventByIdentifierAction(eventSlug);
  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  const event = eventResult.data;
  // Fetch sessions for this event
  const sessionsResult = await getEventSessionsAction(event.id);
  if (!sessionsResult.success || !sessionsResult.data) {
    notFound();
  }

  console.log("Fetched sessions:", sessionsResult.data);

  const sessions = sessionsResult.data;
  return (
    <SessionsManagementClient
      eventId={event.id}
      eventTitle={event.title}
      districtId={event.districtId || ""}
      initialSessions={sessions}
    />
  );
}
