"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomModal } from "@/components/custom/modal";
import { CustomTable } from "@/components/custom/custom-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserForm from "./UserForm";
import { useUserColumns } from "./UserColumns";
import PendingUserActions from "./PendingUserActions";
import { MODULES } from "@/lib/enums";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UsersManagementClientProps {
  initialActiveUsers: any[];
  initialPendingUsers: any[];
}

// Pending User Column Renderer
const pendingUserColumns = [
  {
    key: "firstName",
    title: "User",
    className: "text-xs",
    render: (value: string, row: any) => (
      <div className="min-w-0">
        <div className="font-medium text-slate-900 dark:text-white line-clamp-1 text-xs">
          {value} {row.lastName}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          {row.email}
        </div>
      </div>
    ),
  },
  {
    key: "voicePart",
    title: "Voice & District",
    className: "text-xs hidden md:table-cell",
    render: (value: any, row: any) => (
      <div className="flex flex-col gap-1.5">
        <Badge variant="outline" className="text-xs w-fit">
          {value}
        </Badge>
        <Badge variant="outline" className="text-xs w-fit">
          {row.district.name || "—"}
        </Badge>
      </div>
    ),
  },
  {
    key: "createdAt",
    title: "Submitted",
    className: "text-xs hidden lg:table-cell",
    render: (value: string) => (
      <span className="text-slate-700 dark:text-slate-300">
        {value ? new Date(value).toLocaleDateString() : "-"}
      </span>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-20 text-sm",
    render: (_: any, row: any) => <PendingUserActions user={row} />,
    searchable: false,
  },
];

export default function UsersManagementClient({
  initialActiveUsers,
  initialPendingUsers,
}: UsersManagementClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const userColumns = useUserColumns();

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("User created successfully");
    // Note: revalidatePath in the server action will refresh the page
  };

  return (
    <div className="space-y-6">
      {/* Bulk Upload Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Bulk Upload Users
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Import users from CSV or XLSX file. File should contain: firstName,
          lastName, email, voicePart, district
        </p>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(_e) => {
                // Handle file upload
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800/50 text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </label>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upload
          </Button>
        </div>
      </div>

      {/* Sub-tabs for Pending and Active Users */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none h-auto p-0">
          <TabsTrigger
            value="pending"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3 flex items-center gap-2 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Confirmations
              {initialPendingUsers.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {initialPendingUsers.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3 flex items-center gap-2 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Users
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Pending Users Tab */}
        <TabsContent value="pending" className="m-0 mt-4">
          <CustomTable
            columns={pendingUserColumns}
            data={initialPendingUsers}
            pageSize={10}
            loading={false}
            display={{
              searchComponent: true,
              filterComponent: false,
              exportButton: false,
            }}
            searchPlaceholder="Search pending users..."
            tableTitle="Pending Confirmations"
            tableSubtitle={`${initialPendingUsers.length} pending`}
          />
        </TabsContent>

        {/* Active Users Tab */}
        <TabsContent value="active" className="m-0 mt-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Users
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Manage active users
              </p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              New User
            </Button>
          </div>

          <CustomTable
            columns={userColumns}
            data={initialActiveUsers}
            pageSize={10}
            loading={false}
            display={{
              searchComponent: true,
              filterComponent: false,
              exportButton: false,
            }}
            searchPlaceholder="Search users by name or email..."
            tableTitle="Active Users"
            tableSubtitle={`${initialActiveUsers.length} user${initialActiveUsers.length !== 1 ? "s" : ""}`}
          />
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <CustomModal
        title="Create New User"
        description="Add a new user to the system"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        module={MODULES.USER}
      >
        <UserForm onSuccess={handleCreateSuccess} />
      </CustomModal>
    </div>
  );
}
