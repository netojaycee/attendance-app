/**
 * Email utilities using Resend and React Email
 * Handles user invitations, magic links, password resets, etc.
 */

import { Resend } from "resend";
import { InviteEmail } from "@/emails/InviteEmail";
import { MagicLinkEmail } from "@/emails/MagicLinkEmail";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailFrom = process.env.EMAIL_FROM || "noreply@attendance.app";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Send user invitation with auto-generated password
 */
export async function sendUserInvite(
  email: string,
  firstName: string,
  password: string
): Promise<void> {
  const loginLink = `${appUrl}/login`;

  try {
    const emailHtml = render(
      InviteEmail({
        firstName,
        // email,
        password,
        loginLink,
      })
    );

    await resend.emails.send({
      from: emailFrom,
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
 */
export async function sendMagicLink(email: string, token: string): Promise<void> {
  const magicLinkUrl = `${appUrl}/auth/magic-link?token=${token}`;

  try {
    const emailHtml = render(
      MagicLinkEmail({
        // email,
        url: magicLinkUrl,
      })
    );

    await resend.emails.send({
      from: emailFrom,
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
 */
// export async function sendPasswordResetEmail(
//   email: string,
//   firstName: string,
//   resetToken: string
// ): Promise<void> {
//   const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}`;

//   try {
//     const emailHtml = render(
//       PasswordResetEmail({
//         firstName,
//         resetLink,
//       })
//     );

//     await resend.emails.send({
//       from: emailFrom,
//       to: email,
//       subject: "Reset Your Password",
//       html: emailHtml,
//     });
//   } catch (error) {
//     console.error("Failed to send password reset email:", error);
//     throw error;
//   }
// }

// This component should be created
// const PasswordResetEmail = ({ firstName, resetLink }: { firstName: string; resetLink: string }) => (
  // <div>
  //   <h1>Reset Your Password</h1>
  //   <p>Hi {firstName},</p>
  //   <p>Click the link below to reset your password:</p>
  //   <a href={resetLink}>{resetLink}</a>
  //   <p>This link expires in 1 hour.</p>
  // </div>
// );