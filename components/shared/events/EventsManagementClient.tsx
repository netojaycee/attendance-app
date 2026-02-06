"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import { CustomTable } from "@/components/custom/custom-table";
import EventForm from "./EventForm";
import { useEventColumns } from "./EventColumns";
import { MODULES } from "@/lib/enums";
import { toast } from "sonner";

interface EventsManagementClientProps {
  initialEvents: any[];
}

export default function EventsManagementClient({
  initialEvents,
}: EventsManagementClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const columns = useEventColumns();

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("Event created successfully");
    // Note: revalidatePath in the server action will refresh the page
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Events
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Manage events and their sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <CustomTable
        columns={columns}
        data={initialEvents}
        pageSize={10}
        loading={false}
        display={{
          searchComponent: true,
          filterComponent: false,
          exportButton: false,
        }}
        searchPlaceholder="Search events by title, type, or district..."
        tableTitle="Events List"
        tableSubtitle={`${initialEvents.length} event${initialEvents.length !== 1 ? "s" : ""}`}
      />

      {/* Create Event Modal */}
      <CustomModal
        title="Create New Event"
        description="Add a new event to the system"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        module={MODULES.EVENT}
      >
        <EventForm onSuccess={handleCreateSuccess} />
      </CustomModal>
    </div>
  );
}
