"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomModal } from "@/components/custom/modal";
import { CustomTable } from "@/components/custom/custom-table";
import DistrictForm from "./DistrictForm";
import { useDistrictColumns } from "./DistrictColumns";
import { MODULES } from "@/lib/enums";
import { toast } from "sonner";

interface DistrictManagementClientProps {
  initialDistricts: any[];
}

export default function DistrictManagementClient({
  initialDistricts,
}: DistrictManagementClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const columns = useDistrictColumns();

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("District created successfully");
    // Note: revalidatePath in the server action will refresh the page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Districts
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Manage districts and their members
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              New District
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <CustomTable
        columns={columns}
        data={initialDistricts}
        pageSize={10}
        loading={false}
        display={{
          searchComponent: true,
          filterComponent: false,
          exportButton: false,
        }}
        searchPlaceholder="Search districts by name..."
        tableTitle="Districts List"
        tableSubtitle={`${initialDistricts.length} district${initialDistricts.length !== 1 ? "s" : ""}`}
      />

      {/* Create District Modal */}
      <CustomModal
        title="Create New District"
        description="Add a new district to the system"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        module={MODULES.DISTRICT}
      >
        <DistrictForm onSuccess={handleCreateSuccess} />
      </CustomModal>
    </div>
  );
}
