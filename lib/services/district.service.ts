import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/enums";

export interface CreateDistrictInput {
  name: string;
}

export interface UpdateDistrictInput {
  name?: string;
}



/**
 * Get all districts, ordered by name
 */
export async function getAllDistricts() {
  const districts = await prisma.district.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return districts.map((district) => ({
    ...district,
    createdAt: district.createdAt.toISOString(),
    updatedAt: district.updatedAt.toISOString(),
    _count: district._count,
  }));
}

/**
 * Get a single district by ID
 */
export async function getDistrictById(id: string) {
  const district = await prisma.district.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!district) return null;

  return {
    ...district,
    createdAt: district.createdAt.toISOString(),
    updatedAt: district.updatedAt.toISOString(),
    _count: district._count,
  };
}

/**
 * Create a new district
 * Only admins can create districts
 */
export async function createDistrict(
  name: string,
  currentUserRole: string
) {
  // Verify user is admin
  if (currentUserRole !== Role.ADMIN) {
    throw new Error("Only admins can create districts");
  }

  const district = await prisma.district.create({
    data: {
      name,
    },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return {
    ...district,
    createdAt: district.createdAt.toISOString(),
    updatedAt: district.updatedAt.toISOString(),
    _count: district._count,
  };
}

/**
 * Update a district
 * Only admins can update districts
 */
export async function updateDistrict(
  id: string,
  data: UpdateDistrictInput,
  currentUserRole: string
) {
  // Verify user is admin
  if (currentUserRole !== Role.ADMIN) {
    throw new Error("Only admins can update districts");
  }

  // Verify district exists
  const existing = await prisma.district.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("District not found");
  }

  const district = await prisma.district.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return {
    ...district,
    createdAt: district.createdAt.toISOString(),
    updatedAt: district.updatedAt.toISOString(),
    _count: district._count,
  };
}

/**
 * Delete a district
 * Only admins can delete districts
 * Cannot delete a district that has users
 */
export async function deleteDistrict(id: string, currentUserRole: string): Promise<void> {
  // Verify user is admin
  if (currentUserRole !== Role.ADMIN) {
    throw new Error("Only admins can delete districts");
  }

  // Verify district exists
  const existing = await prisma.district.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!existing) {
    throw new Error("District not found");
  }

  // Check if district has users
  if (existing._count.users > 0) {
    throw new Error(
      "Cannot delete a district that has users assigned to it"
    );
  }

  await prisma.district.delete({
    where: { id },
  });
}
