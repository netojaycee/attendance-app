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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Loader2 } from "lucide-react";
import { VoicePart, Role } from "@/prisma/generated/enums";
import {
  createUserAction,
  updateUserAction,
} from "@/lib/actions/users.actions";
import { getDistrictsAction } from "@/lib/actions/district.actions";

const userSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  voicePart: z.enum([
    VoicePart.SOPRANO,
    VoicePart.ALTO,
    VoicePart.TENOR,
    VoicePart.BASS,
  ]),
  districtId: z.string().min(1, "District is required"),
  instrument: z.string().optional(),
  role: z.enum([
    Role.MEMBER,
    Role.PART_LEADER,
    Role.DISTRICT_LEADER,
    Role.ADMIN,
  ]),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: any & { id?: string };
  isEditMode?: boolean;
  onSuccess?: () => void;
}

export default function UserForm({
  user,
  isEditMode = false,
  onSuccess,
}: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      voicePart: user?.voicePart || VoicePart.SOPRANO,
      districtId: user?.districtId || "",
      instrument: user?.instrument || "",
      role: user?.role || Role.MEMBER,
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

  // Reset form when user prop changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        voicePart: user.voicePart || VoicePart.SOPRANO,
        districtId: user.districtId || "",
        instrument: user.instrument || "",
        role: user.role || Role.MEMBER,
      });
    }
  }, [user, form]);

  const onSubmit = async (values: UserFormData) => {
    try {
      setIsLoading(true);

      if (isEditMode && user?.id) {
        const result = await updateUserAction(user.id, values);
        if (result.success) {
          toast.success("User updated successfully");
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to update user");
        }
      } else {
        const result = await createUserAction(values);
        if (result.success) {
          toast.success("User created successfully");
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || "Failed to create user");
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
              User Information
            </h6>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
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

          {/* Assignment */}
          <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
            <h6 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white">
              Assignment
            </h6>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="voicePart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice Part *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue placeholder="Select voice part" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800">
                          {Object.values(VoicePart).map((part) => (
                            <SelectItem key={part} value={part}>
                              {part}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
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

              <FormField
                control={form.control}
                name="instrument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Piano, Guitar"
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

          {/* Role */}
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
            <h6 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white">
              Role
            </h6>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800">
                          <SelectItem value={Role.MEMBER}>Member</SelectItem>
                          <SelectItem value={Role.PART_LEADER}>
                            Part Leader
                          </SelectItem>
                          <SelectItem value={Role.DISTRICT_LEADER}>
                            District Leader
                          </SelectItem>
                          <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
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
                  <span>{isEditMode ? "Update User" : "Create User"}</span>
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
