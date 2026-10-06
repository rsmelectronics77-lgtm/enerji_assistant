import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { t } from "@/lib/i18n";

// Stage 2: sadə yer tutucu. Tam landing Stage 3-də hazırlanacaq.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4">
      <h1 className="text-4xl font-semibold tracking-tight">{t("brand")}</h1>
      <p className="text-lg text-muted">Elektrik enerjisini harada və nə qədər xərclədiyinizi anlayın və azaldın.</p>
      <div className="flex gap-3">
        <Link href="/register" className={buttonClass("primary")}>{t("auth.register")}</Link>
        <Link href="/login" className={buttonClass("outline")}>{t("auth.login")}</Link>
      </div>
    </main>
  );
}
