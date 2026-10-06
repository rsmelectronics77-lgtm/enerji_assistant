import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").maybeSingle();

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Xoş gəldiniz{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      <p className="mt-2 text-muted">
        Hesab və verilənlər bazası işləyir. Dashboard göstəriciləri hesablama mühərriki (Stage 4) və
        analitika (Stage 5) hazır olduqdan sonra əlavə olunacaq. Hələ implement edilməyib.
      </p>
    </Card>
  );
}
