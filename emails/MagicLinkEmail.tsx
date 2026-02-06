// emails/MagicLinkEmail.tsx: React Email template for magic links
// Includes login URL

import { Button, Container, Heading, Text } from "@react-email/components";

interface MagicLinkEmailProps {
  url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Container>
      <Heading>Magic Link Login</Heading>
      <Text>Click to login:</Text>
      <Button href={url}>Login</Button>
    </Container>
  );
}