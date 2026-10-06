import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { registerAction } from "@/features/auth/actions";
import { t } from "@/lib/i18n";

export default function RegisterPage() {
  return (
    <AuthShell
      title={t("auth.register")}
      footer={<>{t("auth.haveAccount")} <Link className="text-brand underline" href="/login">{t("auth.login")}</Link></>}
    >
      <AuthForm
        action={registerAction}
        submitLabel={t("auth.register")}
        fields={[
          { name: "fullName", label: t("auth.fullName"), type: "text", autoComplete: "name" },
          { name: "email", label: t("auth.email"), type: "email", autoComplete: "email" },
          { name: "password", label: t("auth.password"), type: "password", autoComplete: "new-password" },
        ]}
      />
    </AuthShell>
  );
}
