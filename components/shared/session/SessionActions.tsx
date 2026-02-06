"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import SessionForm from "./SessionForm";
import { deleteSessionAction } from "@/lib/actions/sessions.actions";
import { MODULES } from "@/lib/enums";
import { toast } from "sonner";

interface SessionActionsProps {
  session: any;
  eventId?: string;
  districtId?: string;
  onSuccess?: () => void;
}

export default function SessionActions({
  session,
  eventId,
  districtId,
  onSuccess,
}: SessionActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteSessionAction(session.id);
      if (result.success) {
        toast.success("Session deleted successfully");
        setIsDeleteOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <CustomModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Session"
        description="Update session details"
        module={MODULES.SESSION}
        width="sm:max-w-md"
      >
        <SessionForm
          session={session}
          eventId={eventId || session.eventId}
          districtId={districtId || session.districtId}
          onSuccess={handleEditSuccess}
          onOpenChange={setIsEditOpen}
        />
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Session"
        description="Are you sure you want to delete this session?"
        module={MODULES.SESSION}
        width="sm:max-w-md"
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone. All attendance records for this session will be deleted.
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              className="flex-1"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={() => setIsDeleteOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CustomModal>
    </>
  );
}
