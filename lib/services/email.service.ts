/**
 * Email Service
 * Abstracts email sending logic for all email communications
 * Handles invitations, magic links, password resets, and more
 * Includes rate limiting and retry logic for bulk operations
 */

import { Resend } from "resend";
import { InviteEmail } from "@/emails/InviteEmail";
import { MagicLinkEmail } from "@/emails/MagicLinkEmail";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailFrom = process.env.EMAIL_FROM || "noreply@attendance.app";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Rate limiting configuration
const RATE_LIMIT_DELAY_MS = 100; // Delay between emails (100ms = 10 emails/second)
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic email sending function with retry logic
 * @param options - Email send options (to, subject, html)
 * @param retries - Number of retries on failure (default: 3)
 * @throws Error if email sending fails after all retries
 */
async function sendEmail(
  options: EmailSendOptions,
  retries: number = MAX_RETRIES
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await resend.emails.send({
        from: emailFrom,
        ...options,
      });
      return; // Success, exit
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is rate limit related
      const isRateLimit =
        lastError.message.includes("rate") ||
        lastError.message.includes("429") ||
        lastError.message.includes("Too many requests");

      // Don't retry non-rate-limit errors
      if (!isRateLimit && attempt < retries) {
        continue;
      }

      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        const delayMs = isRateLimit ? RETRY_DELAY_MS * attempt : RETRY_DELAY_MS;
        await sleep(delayMs);
      }
    }
  }

  // All retries failed
  console.error(
    `Failed to send email to ${options.to} after ${retries} attempts:`,
    lastError
  );
  throw lastError || new Error("Failed to send email");
}

/**
 * Send user invitation email with auto-generated password
 * Called when a new user is created
 * 
 * @param email - Recipient email address
 * @param firstName - User's first name
 * @param password - Auto-generated temporary password
 * @throws Error if email sending fails
 */
export async function sendUserInviteEmail(
  email: string,
  firstName: string,
  password: string
): Promise<void> {
  const loginLink = `${appUrl}/login`;

  try {
    const emailHtml = await render(
      InviteEmail({
        firstName,
        password,
        loginLink,
      })
    );

    await sendEmail({
      to: email,
      subject: "Welcome to Choir Attendance - Your Login Credentials",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    throw error;
  }
}

/**
 * Send magic link for passwordless login
 * Called for magic link authentication
 * 
 * @param email - Recipient email address
 * @param token - Unique token for the magic link
 * @throws Error if email sending fails
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const magicLinkUrl = `${appUrl}/auth/magic-link?token=${token}`;

  try {
    const emailHtml = await render(
      MagicLinkEmail({
        url: magicLinkUrl,
      })
    );

    await sendEmail({
      to: email,
      subject: "Your Magic Link Login",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 * Called when user requests a password reset
 * 
 * @param email - Recipient email address
 * @param firstName - User's first name
 * @param token - Password reset token
 * @throws Error if email sending fails
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

  try {
    // TODO: Create PasswordResetEmail component
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset Your Password</h1>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link: ${resetLink}</p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Reset Your Password - Choir Attendance",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

/**
 * Send bulk user invitation emails with rate limiting and retry logic
 * Called when bulk uploading users
 * Implements exponential backoff for rate limits
 * 
 * @param users - Array of users to send invitations to
 * @returns Result object with sent count, failed count, and error details
 */
export async function sendBulkUserInviteEmails(
  users: Array<{
    email: string;
    firstName: string;
    password: string;
  }>
): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    try {
      await sendUserInviteEmail(user.email, user.firstName, user.password);
      results.sent++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: user.email,
        error:
          error instanceof Error ? error.message : "Failed to send email",
      });

      // Log error for debugging
      console.error(
        `Failed to send invitation to ${user.email}:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    // Apply rate limiting: wait between emails (except after the last one)
    if (i < users.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  return results;
}

/**
 * Send event attendance reminder email
 * Called before an event starts
 * 
 * @param email - Recipient email address
 * @param firstName - User's first name
 * @param eventTitle - Title of the event
 * @param eventDate - Date of the event
 * @throws Error if email sending fails
 */
export async function sendEventReminderEmail(
  email: string,
  firstName: string,
  eventTitle: string,
  eventDate: Date
): Promise<void> {
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Event Reminder</h1>
        <p>Hi ${firstName},</p>
        <p>This is a reminder about an upcoming event:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h2>${eventTitle}</h2>
          <p><strong>When:</strong> ${formattedDate}</p>
        </div>
        <p>We look forward to seeing you there!</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `Reminder: ${eventTitle}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send event reminder email:", error);
    throw error;
  }
}

/**
 * Send attendance confirmation email
 * Called when user's attendance is recorded
 * 
 * @param email - Recipient email address
 * @param firstName - User's first name
 * @param eventTitle - Title of the event
 * @param attendanceScore - Attendance percentage score
 * @throws Error if email sending fails
 */
export async function sendAttendanceConfirmationEmail(
  email: string,
  firstName: string,
  eventTitle: string,
  attendanceScore: number
): Promise<void> {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Attendance Recorded</h1>
        <p>Hi ${firstName},</p>
        <p>Your attendance for the following event has been recorded:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h2>${eventTitle}</h2>
          <p><strong>Attendance Score:</strong> ${attendanceScore.toFixed(2)}%</p>
        </div>
        <p>Thank you for your participation!</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `Attendance Confirmed - ${eventTitle}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send attendance confirmation email:", error);
    throw error;
  }
}
