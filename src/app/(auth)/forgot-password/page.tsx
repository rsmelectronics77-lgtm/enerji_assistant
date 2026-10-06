import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { forgotPasswordAction } from "@/features/auth/actions";
import { t } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title={t("auth.forgot")}
      footer={<Link className="text-brand underline" href="/login">{t("auth.login")}</Link>}
    >
      <AuthForm
        action={forgotPasswordAction}
        submitLabel={t("auth.sendReset")}
        fields={[{ name: "email", label: t("auth.email"), type: "email", autoComplete: "email" }]}
      />
    </AuthShell>
  );
}
