import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <span className="font-semibold text-brand">{t("brand")}</span>
        <form action={logoutAction}>
          <Button variant="ghost" type="submit">{t("auth.logout")}</Button>
        </form>
      </header>
      {children}
    </div>
  );
}
