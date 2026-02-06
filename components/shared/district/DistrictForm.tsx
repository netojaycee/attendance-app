"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  createDistrictAction,
  updateDistrictAction,
} from "@/lib/actions/district.actions";

const districtSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

type DistrictFormData = z.infer<typeof districtSchema>;

interface DistrictFormProps {
  district?: any & { id?: string };
  isEditMode?: boolean;
  onSuccess?: () => void;
}

export default function DistrictForm({
  district,
  isEditMode = false,
  onSuccess,
}: DistrictFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DistrictFormData>({
    resolver: zodResolver(districtSchema),
    defaultValues: {
      name: district?.name || "",
    },
  });

  // Reset form when district prop changes
  useEffect(() => {
    if (district) {
      form.reset({
        name: district.name || "",
      });
    }
  }, [district, form]);

  const onSubmit = async (values: DistrictFormData) => {
    try {
      setIsLoading(true);

      if (isEditMode && district?.id) {
        const result = await updateDistrictAction(district.id, {
          name: values.name,
        });
        if (result.success) {
          toast.success("District updated successfully");
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to update district");
        }
      } else {
        const result = await createDistrictAction({
          name: values.name,
        });
        if (result.success) {
          toast.success("District created successfully");
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to create district");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h6 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white">
              District Information
            </h6>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Central District"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  <span>{isEditMode ? "Update District" : "Create District"}</span>
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
