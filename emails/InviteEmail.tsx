// emails/InviteEmail.tsx: React Email template for user invites
// Simple, clean HTML email with password and link

import { formatName } from "@/lib/utils";
import { Button, Container, Heading, Text } from "@react-email/components";

interface InviteEmailProps {
  firstName: string;
  password: string;
  loginLink: string;
}

export function InviteEmail({
  firstName,
  password,
  loginLink,
}: InviteEmailProps) {
  return (
    <Container>
      <Heading>Welcome! {formatName(firstName, "")}</Heading>
      <Text>Your temporary password: {password}</Text>
      <Button href={loginLink}>Login and Change Password</Button>
    </Container>
  );
}
