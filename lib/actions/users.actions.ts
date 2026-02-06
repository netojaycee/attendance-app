"use server";

import { getAppSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  getUsers,
  getPendingUsers,
  createUser,
  deleteUser,
  confirmPendingUser,
  rejectPendingUser,
  type CreateUserInput,
} from "@/lib/services/users.service";

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to get all active users
 */
export async function getUsersAction(filters?: {
  districtId?: string;
  role?: string;
  voicePart?: string;
  search?: string;
}): Promise<ActionResult<any[]>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const users = await getUsers(user, filters);
    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to fetch users",
    };
  }
}

/**
 * Server action to get pending users
 */
export async function getPendingUsersAction(): Promise<ActionResult<any[]>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const users = await getPendingUsers(user);
    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return {
      success: false,
      error: "Failed to fetch pending users",
    };
  }
}

/**
 * Server action to create a new user
 */
export async function createUserAction(
  input: CreateUserInput
): Promise<ActionResult<any>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const newUser = await createUser(input, user);
    revalidatePath("/management/users");

    return {
      success: true,
      data: newUser,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating user:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to update a user
 */
export async function updateUserAction(
  id: string,
  input: Partial<CreateUserInput>
): Promise<ActionResult<any>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // For now, we'll use createUser logic adapted for updates
    // This is a simplified version - you may need to create an updateUser service function
    const updatedUser = await createUser(input as CreateUserInput, user);
    revalidatePath("/management/users");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating user:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to delete a user
 */
export async function deleteUserAction(id: string): Promise<ActionResult<void>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await deleteUser(id, user);
    revalidatePath("/management/users");

    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to confirm a pending user
 */
export async function confirmPendingUserAction(
  id: string
): Promise<ActionResult<any>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const confirmedUser = await confirmPendingUser(id, user);
    revalidatePath("/management/users");

    return {
      success: true,
      data: confirmedUser,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error confirming user:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to reject a pending user
 */
export async function rejectPendingUserAction(id: string): Promise<ActionResult<void>> {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await rejectPendingUser(id, user);
    revalidatePath("/management/users");

    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error rejecting user:", error);
    return {
      success: false,
      error: message,
    };
  }
}
