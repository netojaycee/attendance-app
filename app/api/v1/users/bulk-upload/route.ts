/**
 * POST /api/v1/users/bulk-upload
 * Bulk upload users from CSV or XLSX file
 * Authorization: ADMIN for any district, DISTRICT_LEADER for their district only
 * 
 * Body: districtId (required) + either users array (JSON) or file (multipart)
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  ForbiddenError,
  ValidationError,
} from "@/lib/api-errors";
import { Role } from "@/prisma/generated/enums";
import { BulkUser, BulkUserSchema } from "@/lib/schema";
import { getAppSession } from "@/lib/session";
import { generateRandomPassword } from "@/lib/utils";
import { sendUserInvite } from "@/lib/email";
import { hash } from "bcryptjs";
import XLSX from 'xlsx'





export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const { user } = await getAppSession();

    let users: BulkUser[] = [];
    let districtId: string | null = null;

    // Parse JSON or form data with file
    if (contentType.includes("application/json")) {
      const body = await req.json();
      districtId = body.districtId;
      users = Array.isArray(body.users) ? body.users : [body];
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      districtId = formData.get("districtId") as string;
      const file = formData.get("file") as File;

      if (!file) {
        throw new Error("No file provided");
      }

      users = await parseFile(file);
    } else {
      throw new Error(
        "Invalid content type. Use application/json or multipart/form-data"
      );
    }

    // Validate districtId is provided
    if (!districtId || districtId.trim() === "") {
      throw new ValidationError("District ID is required");
    }

    // Check authorization: District leaders can only upload to their district
    if (user.role === Role.DISTRICT_LEADER && user.districtId !== districtId) {
      throw new ForbiddenError(
        "You can only upload users to your district"
      );
    }

    if (users.length === 0) {
      throw new Error("No users to import");
    }

    // Validate all users before creating any
    const validationResults = users.map((u, index) => {
      // Set districtId from parameter, remove from data if present
      const userData = { ...u, districtId };
      const result = BulkUserSchema.safeParse(userData);
      return { index, data: userData, result };
    });

    const errors: Array<{ row: number; error: string }> = [];
    const validUsers: Array<BulkUser & { row: number }> = [];

    for (const { index, result } of validationResults) {
      if (!result.success) {
        errors.push({
          row: index + 2, // +2 for 1-based index + header row
          error: Object.values(result.error.flatten().fieldErrors)[0]?.[0] ||
            "Invalid data",
        });
      } else {
        validUsers.push({
          ...result.data,
          row: index + 2,
        });
      }
    }

    // Check for duplicate emails
    const emails = validUsers.map((u) => u.email);
    const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);
    if (duplicates.length > 0) {
      duplicates.forEach((email) => {
        const indices = emails
          .map((e, i) => (e === email ? i : -1))
          .filter((i) => i >= 0);
        indices.forEach((idx) => {
          errors.push({
            row: validUsers[idx].row,
            error: `Duplicate email: ${email}`,
          });
        });
      });
      validUsers.splice(0, validUsers.length, ...validUsers.filter((u) => !duplicates.includes(u.email)));
    }

    // Check if emails already exist in database
    const existingEmails = await prisma.user.findMany({
      where: {
        email: {
          in: validUsers.map((u) => u.email),
        },
      },
      select: { email: true },
    });

    const existingEmailSet = new Set(existingEmails.map((u) => u.email));
    const duplicateDbEmails: string[] = [];

    const finalUsers = validUsers.filter((u) => {
      if (existingEmailSet.has(u.email)) {
        errors.push({
          row: u.row,
          error: `Email already exists: ${u.email}`,
        });
        duplicateDbEmails.push(u.email);
        return false;
      }
      return true;
    });

    if (finalUsers.length === 0) {
      return Response.json(
        {
          success: false,
          message: "No valid users to import",
          errors,
        },
        { status: 400 }
      );
    }

    // Create users
    const createdUsers = [];
    for (const userData of finalUsers) {
      try {
        // Generate password and hash it
        const randomPassword = generateRandomPassword();
        const hashedPassword = await hash(randomPassword, 10);

        const newUser = await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            voicePart: userData.voicePart,
            role: (userData.role as Role) || Role.MEMBER,
            districtId: userData.districtId,
            instrument: userData.instrument || null,
            password: hashedPassword,
            firstLogin: true,
          },
        });

        createdUsers.push({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        });

        // Send invitation email with password
        try {
          await sendUserInvite(newUser.email, newUser.firstName, randomPassword);
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the request, user was created
        }
      } catch (error) {
        errors.push({
          row: userData.row,
          error: error instanceof Error ? error.message : "Failed to create user",
        });
      }
    }

    return Response.json(
      successResponse({
        message: `Successfully imported ${createdUsers.length} user(s)`,
        data: {
          imported: createdUsers.length,
          total: users.length,
          users: createdUsers,
          errors:
            errors.length > 0
              ? errors
              : undefined,
        },
      })
    );
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof ValidationError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    const { response, statusCode } = errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
    return Response.json(response, { status: statusCode });
  }
}

/**
 * Parse CSV or XLSX file
 */
async function parseFile(file: File): Promise<BulkUser[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    return parseCSV(await file.text());
  } else if (
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls")
  ) {
    return parseXLSX(await file.arrayBuffer());
  } else {
    throw new Error(
      "Invalid file format. Please use CSV or XLSX"
    );
  }
}

/**
 * Parse CSV file
 */
function parseCSV(content: string): BulkUser[] {
  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV file must have header row and at least one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const users: BulkUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<any, any> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    users.push({
      email: row.email || "",
      firstName: row.firstname || row["firstName"] || "",
      lastName: row.lastname || row["lastName"] || "",
      voicePart: row.voicepart || row["voicePart"],
      role: row.role as any,
      districtId: row.districtid || row["districtId"],
      instrument: row.instrument,
    });
  }

  return users;
}

/**
 * Parse XLSX file
 */
async function parseXLSX(buffer: ArrayBuffer): Promise<BulkUser[]> {
  try {
    // Dynamic import to avoid issues if xlsx is not installed

    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      throw new Error("No worksheet found in XLSX file");
    }

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (data.length === 0) {
      throw new Error("XLSX file is empty");
    }

    return data.map((row) => ({
      email: row.email || row.Email || "",
      firstName: row.firstName || row["First Name"] || row.first_name || "",
      lastName: row.lastName || row["Last Name"] || row.last_name || "",
      voicePart: row.voicePart || row["Voice Part"] || row.voice_part,
      role: row.role || row.Role,
      districtId: row.districtId || row["District ID"] || row.district_id,
      instrument: row.instrument || row.Instrument,
    }));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Cannot find module")
    ) {
      throw new Error(
        "XLSX support not installed. Please use CSV format or install xlsx package."
      );
    }
    throw error;
  }
}
