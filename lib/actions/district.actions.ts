"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  getAllDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  type CreateDistrictInput,
  type UpdateDistrictInput,
} from "@/lib/services/district.service";

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to get all districts
 */
export async function getDistrictsAction(): Promise<ActionResult<any[]>> {
  try {
    const districts = await getAllDistricts();
    return {
      success: true,
      data: districts,
    };
  } catch (error) {
    console.error("Error fetching districts:", error);
    return {
      success: false,
      error: "Failed to fetch districts",
    };
  }
}

/**
 * Server action to get a single district
 */
export async function getDistrictAction(
  id: string
): Promise<ActionResult<any>> {
  try {
    const district = await getDistrictById(id);
    if (!district) {
      return {
        success: false,
        error: "District not found",
      };
    }
    return {
      success: true,
      data: district,
    };
  } catch (error) {
    console.error("Error fetching district:", error);
    return {
      success: false,
      error: "Failed to fetch district",
    };
  }
}

/**
 * Server action to create a district
 */
export async function createDistrictAction(
  input: CreateDistrictInput
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const district = await createDistrict(input.name, user.role);
    revalidatePath("/management/districts");
    return {
      success: true,
      data: district,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating district:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to update a district
 */
export async function updateDistrictAction(
  id: string,
  input: UpdateDistrictInput
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const district = await updateDistrict(id, input, user.role);
    revalidatePath("/management/districts");
    return {
      success: true,
      data: district,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating district:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to delete a district
 */
export async function deleteDistrictAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await deleteDistrict(id, user.role);
    revalidatePath("/management/districts");
    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting district:", error);
    return {
      success: false,
      error: message,
    };
  }
}
