import { redirect } from "next/navigation";

type VorgangPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VorgangPage({ params }: VorgangPageProps) {
  const { id } = await params;
  redirect(`/workspace/${id}`);
}
