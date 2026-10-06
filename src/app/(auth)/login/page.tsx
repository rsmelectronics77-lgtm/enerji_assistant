import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginAction } from "@/features/auth/actions";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <AuthShell
      title={t("auth.login")}
      footer={<>{t("auth.noAccount")} <Link className="text-brand underline" href="/register">{t("auth.register")}</Link></>}
    >
      <AuthForm
        action={loginAction}
        submitLabel={t("auth.login")}
        fields={[
          { name: "email", label: t("auth.email"), type: "email", autoComplete: "email" },
          { name: "password", label: t("auth.password"), type: "password", autoComplete: "current-password" },
        ]}
      />
      <Link href="/forgot-password" className="mt-4 block text-sm text-muted underline">{t("auth.forgot")}</Link>
    </AuthShell>
  );
}
