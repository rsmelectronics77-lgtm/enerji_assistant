import Link from "next/link";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/i18n";

export function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 text-lg font-semibold text-brand">{t("brand")}</Link>
      <Card>
        <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        {children}
      </Card>
      {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
    </main>
  );
}
