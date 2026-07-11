import { redirect } from "next/navigation";

type LegacyObjektPageProps = {
  params: Promise<{ objectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyObjektPage({
  params,
  searchParams,
}: LegacyObjektPageProps) {
  const { objectId } = await params;
  const query = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(
    `/objekte/${encodeURIComponent(decodeURIComponent(objectId))}${suffix}`
  );
}
