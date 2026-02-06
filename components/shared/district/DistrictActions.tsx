"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import DistrictForm from "./DistrictForm";
import { MODULES } from "@/lib/enums";
import { deleteDistrictAction } from "@/lib/actions/district.actions";
import { toast } from "sonner";

interface DistrictActionsProps {
  district: any;
  onRefresh?: () => void;
}

export default function DistrictActions({
  district,
  onRefresh,
}: DistrictActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteDistrictAction(district.id);
      if (result.success) {
        toast.success("District deleted successfully");
        setIsDeleteOpen(false);
        if (onRefresh) onRefresh();
      } else {
        toast.error(result.error || "Failed to delete district");
      }
    } catch (error) {
      console.error("Error deleting district:", error);
      toast.error("Failed to delete district");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <CustomModal
        title="Edit District"
        description="Update district information"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        module={MODULES.DISTRICT}
      >
        <DistrictForm
          district={district}
          isEditMode={true}
          onSuccess={handleEditSuccess}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        title="Delete District"
        description="Are you sure you want to delete this district? This action cannot be undone."
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        module={MODULES.DISTRICT}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            District: <span className="font-semibold">{district.name}</span>
          </p>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </CustomModal>
    </>
  );
}
