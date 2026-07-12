import { redirect } from "next/navigation";
import { AdminPanelPage } from "@/features/admin/components/admin-panel-page";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminSettingsPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    if (!user || !(await isSuperAdmin(user.id))) {
      redirect("/einstellungen");
    }
  }

  return <AdminPanelPage />;
}
