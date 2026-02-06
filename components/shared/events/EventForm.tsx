"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Loader2 } from "lucide-react";
import { EventType } from "@/prisma/generated/enums";
import {
  createEventAction,
  updateEventAction,
} from "@/lib/actions/events.actions";
import { getDistrictsAction } from "@/lib/actions/district.actions";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum([EventType.SINGLE_DISTRICT, EventType.MULTI_DISTRICT]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  districtId: z.string().optional(),
  passMark: z.number().min(0).max(100),
  weeklyConstraint: z.boolean(),
  minimumMinutesPerWeek: z.number(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: any & { id?: string };
  isEditMode?: boolean;
  onSuccess?: () => void;
}

export default function EventForm({
  event,
  isEditMode = false,
  onSuccess,
}: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);

  console.log(event);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      type: event?.type || EventType.SINGLE_DISTRICT,
      startDate: event?.startDate ? event.startDate.split("T")[0] : "",
      endDate: event?.endDate ? event.endDate.split("T")[0] : "",
      districtId: event?.districtId || "",
      passMark: event?.passMark || 75,
      weeklyConstraint: event?.weeklyConstraint || false,
      minimumMinutesPerWeek: event?.minimumMinutesPerWeek || 240,
    },
  });

  // Fetch districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const result = await getDistrictsAction();
        if (result.success && result.data) {
          setDistricts(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch districts:", error);
      }
    };
    fetchDistricts();
  }, []);

  // Reset form when event prop changes
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        type: event.type || EventType.SINGLE_DISTRICT,
        startDate: event.startDate ? event.startDate.split("T")[0] : "",
        endDate: event.endDate ? event.endDate.split("T")[0] : "",
        districtId: event.districtId || "",
        passMark: event.passMark || 75,
        weeklyConstraint: event.weeklyConstraint || false,
        minimumMinutesPerWeek: event.minimumMinutesPerWeek || 240,
      });
    }
  }, [event, form]);

  const onSubmit = async (values: EventFormData) => {
    try {
      setIsLoading(true);

      if (isEditMode && event?.id) {
        const result = await updateEventAction(event.id, values);
        if (result.success) {
          toast.success("Event updated successfully");
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to update event");
        }
      } else {
        // const slug = generateSlug(values.title);
        const result = await createEventAction(
          values.title,
          values.description,
          values.type,
          values.startDate,
          values.endDate,
          values.weeklyConstraint,
          values.minimumMinutesPerWeek,
          values.districtId,
          values.passMark,
        );
        if (result.success) {
          toast.success("Event created successfully");
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to create event");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const eventType = form.watch("type");

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h6 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white">
              Basic Information
            </h6>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Spring Concert Rehearsal"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Event description and details"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800">
                          <SelectItem value={EventType.SINGLE_DISTRICT}>
                            Single District
                          </SelectItem>
                          <SelectItem value={EventType.MULTI_DISTRICT}>
                            Multi District
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dates and District */}
          <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
            <h6 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white">
              Schedule & Location
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="dark:bg-slate-800 dark:border-slate-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="dark:bg-slate-800 dark:border-slate-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {eventType === EventType.SINGLE_DISTRICT && (
                <FormField
                  control={form.control}
                  name="districtId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>District *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full dark:bg-slate-800 dark:border-slate-700">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-800">
                            {districts.map((district) => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Performance Settings */}
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
            <h6 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white">
              Performance Settings
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passMark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass Mark (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="dark:bg-slate-800 dark:border-slate-700"
                        placeholder="75"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weeklyConstraint"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded border-slate-300"
                    />
                    <FormLabel className="mb-0 cursor-pointer">
                      Enable Weekly Constraint
                    </FormLabel>
                  </FormItem>
                )}
              />

              {form.watch("weeklyConstraint") && (
                <FormField
                  control={form.control}
                  name="minimumMinutesPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Minutes Per Week *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="dark:bg-slate-800 dark:border-slate-700"
                          placeholder="240"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onSuccess?.()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Please wait</span>
                </>
              ) : (
                <>
                  <span>{isEditMode ? "Update Event" : "Create Event"}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
