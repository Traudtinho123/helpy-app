import { KundenaktePageClient } from "@/features/kundenakte/components/kundenakte-page-client";

type KundenAktePageProps = {
  params: Promise<{ vorgangId: string }>;
};

export default async function KundenAktePage({ params }: KundenAktePageProps) {
  const { vorgangId } = await params;

  return (
    <KundenaktePageClient vorgangId={decodeURIComponent(vorgangId)} />
  );
}
