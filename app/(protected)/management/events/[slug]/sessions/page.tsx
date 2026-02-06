import SessionsManagement from "@/components/shared/session/SessionsManagement";

interface SessionsPageProps {
  params: {
    slug: string;
  };
}

export default async function SessionsPage({ params }: SessionsPageProps) {
  const { slug } = await params;
  return <SessionsManagement eventSlug={slug} />;
}
