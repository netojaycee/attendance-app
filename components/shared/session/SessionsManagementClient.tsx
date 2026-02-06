"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import { CustomTable } from "@/components/custom/custom-table";
import SessionForm from "./SessionForm";
import { useSessionColumns } from "./SessionColumns";
import SessionActions from "./SessionActions";
import { MODULES } from "@/lib/enums";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SessionsManagementClientProps {
  eventId: string;
  eventTitle: string;
  districtId: string;
  initialSessions: any[];
}

export default function SessionsManagementClient({
  eventId,
  eventTitle,
  districtId,
  initialSessions,
}: SessionsManagementClientProps) {
  const [sessions, _setSessions] = useState(initialSessions);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const sessionColumns = useSessionColumns();
  const router = useRouter();

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("Session created successfully");
    // Reload the page to get fresh data
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    toast.success("Session deleted successfully");
    // Reload the page to get fresh data
    router.refresh();
  };

  // Add actions column
  const columnsWithActions = sessionColumns.map((col) => {
    if (col.key === "actions") {
      return {
        ...col,
        render: (_: any, row: any) => (
          <SessionActions
            session={row}
            eventId={eventId}
            districtId={districtId}
            onSuccess={handleDeleteSuccess}
          />
        ),
      };
    }
    return col;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Sessions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {eventTitle}
            </p>
          </div>
        </div>
        <CustomModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Create Session"
          description="Add a new session to this event"
          module={MODULES.SESSION}
          width="sm:max-w-md"
          trigger={
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          }
        >
          <SessionForm
            eventId={eventId}
            districtId={districtId}
            onSuccess={handleCreateSuccess}
            onOpenChange={setIsCreateOpen}
          />
        </CustomModal>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {sessions.length > 0 ? (
          <CustomTable
            data={sessions}
            columns={columnsWithActions}
            searchPlaceholder="Search sessions..."
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">
              No sessions yet. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
