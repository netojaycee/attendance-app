"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { toast } from "sonner";
import {
  createSessionAction,
  updateSessionAction,
} from "@/lib/actions/sessions.actions";
import { Clock } from "lucide-react";

const sessionSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  session?: any;
  eventId: string;
  districtId: string;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export default function SessionForm({
  session,
  eventId,
  districtId,
  onSuccess,
  onOpenChange,
}: SessionFormProps) {
  const isEdit = !!session;
  const [isLoading, setIsLoading] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      startTime: session?.startTime
        ? new Date(session.startTime).toISOString().slice(0, 16)
        : "",
      endTime: session?.endTime
        ? new Date(session.endTime).toISOString().slice(0, 16)
        : "",
      durationMinutes: session?.durationMinutes || 60,
    },
  });

  const startTime = watch("startTime");
  const endTime = watch("endTime");

  // Auto-calculate duration and validate when times change
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
      
      // Real-time validation: check if start time is before end time
      if (start >= end) {
        setTimeValidationError("Start time must be before end time");
      } else if (minutes <= 0) {
        setTimeValidationError("Duration must be at least 1 minute");
      } else {
        setTimeValidationError(null);
        setValue("durationMinutes", minutes);
      }
    }
  }, [startTime, endTime, setValue]);

  const onSubmit = async (data: SessionFormData) => {
    try {
      setIsLoading(true);
      const startDateTime = new Date(data.startTime).toISOString();
      const endDateTime = new Date(data.endTime).toISOString();

      if (isEdit) {
        const result = await updateSessionAction(session.id, {
          startTime: startDateTime,
          endTime: endDateTime,
          durationMinutes: data.durationMinutes,
          //   status: data.status,
        });
        if (result.success) {
          toast.success("Session updated successfully");
          if (onOpenChange) onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to update session");
        }
      } else {
        const result = await createSessionAction({
          eventId,
          districtId,
          startTime: startDateTime,
          endTime: endDateTime,
          durationMinutes: data.durationMinutes,
          //   status: data.status,
        });
        if (result.success) {
          toast.success("Session created successfully");
          if (onOpenChange) onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to create session");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      {/* Schedule Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 rounded-lg">
          <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Schedule
          </h3>
        </div>
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="startTime" className="text-xs font-bold">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
                className="mt-1"
              />
              {errors.startTime && (
                <span className="text-xs text-red-600">
                  {errors.startTime.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="endTime" className="text-xs font-bold">
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register("endTime")}
                className="mt-1"
              />
              {errors.endTime && (
                <span className="text-xs text-red-600">
                  {errors.endTime.message}
                </span>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="duration" className="text-xs font-bold">
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              {...register("durationMinutes", { valueAsNumber: true })}
              className="mt-1"
              readOnly
            />
            {timeValidationError ? (
              <span className="text-xs text-red-600 font-semibold">
                {timeValidationError}
              </span>
            ) : (
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                (Automatically calculated from start and end times)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Section */}
      {/* <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white px-4">
          Status
        </h3>
        <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/50 rounded-lg p-4 space-y-3">
          <div>
            <Label htmlFor="status" className="text-xs font-bold">
              Session Status
            </Label>
            <Select
              defaultValue={watch("status")}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div> */}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="submit"
          disabled={isLoading || !!timeValidationError}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Saving..."
            : isEdit
              ? "Update Session"
              : "Create Session"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange?.(false)}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
