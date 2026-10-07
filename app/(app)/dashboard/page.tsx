import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").maybeSingle();

  return (
    <Card>
      <h1 className="text-2xl font-semibold">
        {t("dashboard.welcome")}
        {profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <p className="mt-2 text-muted">{t("dashboard.intro")}</p>
      <Link href="/properties" className={buttonClass("primary", "mt-5")}>
        {t("dashboard.cta")}
      </Link>
    </Card>
  );
}
