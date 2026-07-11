"use client";

import { ObjektakteView } from "@/features/portfolio/components/objektakte-view";

type RealEstateObjectFocusViewProps = {
  objectId: string;
};

/** @deprecated Nutze ObjektakteView oder Route /objekte/[id] */
export function RealEstateObjectFocusView({
  objectId,
}: RealEstateObjectFocusViewProps) {
  return <ObjektakteView objectId={objectId} />;
}
