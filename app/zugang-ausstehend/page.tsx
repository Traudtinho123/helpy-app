import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export default function ZugangAusstehendRedirectPage() {
  redirect(AUTH_ROUTES.welcome);
}
