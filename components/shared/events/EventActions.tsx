"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit3, Trash2 } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import { MODULES } from "@/lib/enums";
import { toast } from "sonner";
import EventForm from "./EventForm";
import { useRouter } from "next/navigation";
import { deleteEventAction } from "@/lib/actions/events.actions";
import ConfirmationForm from "@/components/shared/ConfirmationForm";

interface EventActionsProps {
  event: any;
  onRefresh?: () => void;
}

export default function EventActions({ event, onRefresh }: EventActionsProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = () => {
    setDropdownOpen(false);
    setTimeout(() => setEditOpen(true), 100);
  };

  const handleDeleteClick = () => {
    setDropdownOpen(false);
    setTimeout(() => setDeleteOpen(true), 100);
  };

  const handleConfirmDelete = async (confirmed: boolean) => {
    if (confirmed) {
      try {
        setIsDeleting(true);
        const result = await deleteEventAction(event.id);
        if (result.success) {
          toast.success("Event deleted successfully");
          setDeleteOpen(false);
          if (onRefresh) onRefresh();
        } else {
          toast.error(result.error || "Failed to delete event");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      } finally {
        setIsDeleting(false);
      }
    } else {
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              router.push(`/management/events/${event.slug}/sessions`);
            }}
          >
            <Eye className="size-4 mr-2" /> View Sessions
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleEditClick();
            }}
          >
            <Edit3 className="size-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleDeleteClick();
            }}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="size-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <CustomModal
        title={`Edit Event: ${event.title}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        module={MODULES.EVENT}
      >
        <EventForm
          event={event}
          isEditMode
          onSuccess={() => {
            setEditOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        title="Confirm Deletion"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        module={MODULES.EVENT}
      >
        <ConfirmationForm
          title={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
          onResult={handleConfirmDelete}
          loading={isDeleting}
        />
      </CustomModal>
    </>
  );
}
