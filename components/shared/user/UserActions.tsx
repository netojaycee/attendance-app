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
import UserForm from "./UserForm";
import { MODULES } from "@/lib/enums";
import { deleteUserAction } from "@/lib/actions/users.actions";
import { toast } from "sonner";

interface UserActionsProps {
  user: any;
  onRefresh?: () => void;
}

export default function UserActions({ user, onRefresh }: UserActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteUserAction(user.id);
      if (result.success) {
        toast.success("User deleted successfully");
        setIsDeleteOpen(false);
        if (onRefresh) onRefresh();
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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
        title="Edit User"
        description="Update user information"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        module={MODULES.USER}
      >
        <UserForm
          user={user}
          isEditMode={true}
          onSuccess={handleEditSuccess}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        module={MODULES.USER}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            User: <span className="font-semibold">{user.firstName} {user.lastName}</span>
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
