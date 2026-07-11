import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ObjektakteView } from "@/features/portfolio/components/objektakte-view";
import {
  parseObjectNavigationOrigin,
  parseObjektInitialTab,
} from "@/features/portfolio/services/object-navigation";

type ObjektaktePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ObjektaktePage({
  params,
  searchParams,
}: ObjektaktePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const origin = parseObjectNavigationOrigin(query);
  const initialTab = parseObjektInitialTab(query);

  return (
    <DashboardShell>
      <ObjektakteView
        objectId={decodeURIComponent(id)}
        navigationOrigin={origin}
        initialTab={initialTab}
      />
    </DashboardShell>
  );
}
