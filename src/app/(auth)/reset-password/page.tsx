import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { resetPasswordAction } from "@/features/auth/actions";
import { t } from "@/lib/i18n";

export default function ResetPasswordPage() {
  return (
    <AuthShell title={t("auth.newPassword")}>
      <AuthForm
        action={resetPasswordAction}
        submitLabel={t("auth.savePassword")}
        fields={[{ name: "password", label: t("auth.newPassword"), type: "password", autoComplete: "new-password" }]}
      />
    </AuthShell>
  );
}
