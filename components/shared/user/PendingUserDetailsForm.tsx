"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { confirmPendingUserAction, rejectPendingUserAction } from "@/lib/actions/users.actions";
import { toast } from "sonner";

interface PendingUserDetailsFormProps {
  user: any;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export default function PendingUserDetailsForm({
  user,
  onSuccess,
  onOpenChange,
}: PendingUserDetailsFormProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      const result = await confirmPendingUserAction(user.id);
      if (result.success) {
        toast.success("User confirmed successfully");
        if (onOpenChange) onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Failed to confirm user");
      }
    } catch (error) {
      console.error("Error confirming user:", error);
      toast.error("Failed to confirm user");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const result = await rejectPendingUserAction(user.id);
      if (result.success) {
        toast.success("User rejected successfully");
        if (onOpenChange) onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Failed to reject user");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* User Information Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                First Name
              </label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                {user.firstName}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Last Name
              </label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                {user.lastName}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Email
            </label>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assignment</h3>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Voice Part
              </label>
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {user.voicePart}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                District
              </label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                {user.district?.name || "—"}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Instrument
            </label>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              {user.instrument || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Submission Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submission</h3>
        <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/50 rounded-lg p-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Submitted On
            </label>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          onClick={handleConfirm}
          disabled={isConfirming || isRejecting}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isConfirming ? "Confirming..." : "Confirm User"}
        </Button>
        <Button
          onClick={handleReject}
          disabled={isConfirming || isRejecting}
          variant="destructive"
          className="flex-1"
        >
          <XCircle className="w-4 h-4 mr-2" />
          {isRejecting ? "Rejecting..." : "Reject User"}
        </Button>
      </div>
    </div>
  );
}
