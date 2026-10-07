import Link from "next/link";
import { EntityForm, type FormField } from "@/components/forms/entity-form";
import { Card } from "@/components/ui/card";
import { createPropertyAction } from "@/features/properties/actions";
import { PROPERTY_TYPES } from "@/features/properties/schemas";
import { t, type MessageKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

interface PropertyRow {
  id: string;
  name: string;
  type: string;
  city: string | null;
}

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name,type,city")
    .order("created_at", { ascending: false });
  const properties = (data ?? []) as PropertyRow[];

  const fields: FormField[] = [
    { name: "name", label: t("property.name"), kind: "text", placeholder: "Mənim evim" },
    {
      name: "type",
      label: t("property.type"),
      kind: "select",
      options: PROPERTY_TYPES.map((v) => ({ value: v, label: t(`property.types.${v}`) })),
    },
    { name: "city", label: t("property.city"), kind: "text", placeholder: "Bakı" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("property.title")}</h1>
        <p className="mt-1 text-muted">{t("property.subtitle")}</p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <p className="text-muted">{t("property.empty")}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`} className="block">
              <Card className="transition hover:border-brand">
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {t(`property.types.${p.type}` as MessageKey)}
                  {p.city ? ` · ${p.city}` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">{t("property.add")}</h2>
        <EntityForm action={createPropertyAction} fields={fields} submitLabel={t("property.add")} />
      </Card>
    </div>
  );
}
