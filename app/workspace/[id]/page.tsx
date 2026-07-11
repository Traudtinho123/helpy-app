import { WorkspacePageClient } from "@/features/workspace/components/workspace-page-client";

type WorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  return <WorkspacePageClient id={id} />;
}
