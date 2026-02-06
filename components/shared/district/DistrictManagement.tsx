import React from "react";
import DistrictManagementClient from "./DistrictManagementClient";
import { notFound } from "next/navigation";
import { getDistrictsAction } from "@/lib/actions/district.actions";

export default async function DistrictManagement() {
  const result = await getDistrictsAction();

  if (!result.success || !result.data) {
    notFound();
  }

  const districts = result.data;

  return <DistrictManagementClient initialDistricts={districts} />;
}
