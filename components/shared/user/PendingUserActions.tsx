"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import { MODULES } from "@/lib/enums";
import PendingUserDetailsForm from "./PendingUserDetailsForm";

interface PendingUserActionsProps {
  user: any;
  onRefresh?: () => void;
}

export default function PendingUserActions({
  user,
  onRefresh,
}: PendingUserActionsProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSuccess = () => {
    setIsDetailsOpen(false);
    if (onRefresh) onRefresh();
  };

  return (
    <CustomModal
      open={isDetailsOpen}
      onOpenChange={setIsDetailsOpen}
      title="Review Pending User"
      description="Review user details and confirm or reject their registration"
      module={MODULES.USER}
      width="sm:max-w-md"
      trigger={
        <Button
          size="icon"
          className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400"
        >
          <Eye className="w-4 h-4" />
        </Button>
      }
    >
      <PendingUserDetailsForm
        user={user}
        onSuccess={handleSuccess}
        onOpenChange={setIsDetailsOpen}
      />
    </CustomModal>
  );
}
