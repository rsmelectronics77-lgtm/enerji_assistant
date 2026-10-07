import Link from "next/link";
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
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-brand">
            {t("brand")}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted hover:text-ink">
              {t("nav.dashboard")}
            </Link>
            <Link href="/properties" className="text-muted hover:text-ink">
              {t("nav.properties")}
            </Link>
          </nav>
        </div>
        <form action={logoutAction}>
          <Button variant="ghost" type="submit">{t("auth.logout")}</Button>
        </form>
      </header>
      {children}
    </div>
  );
}
