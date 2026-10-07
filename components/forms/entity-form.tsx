"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FormState } from "@/features/properties/form-state";

export interface FormField {
  name: string;
  label: string;
  /** "number" onluq vergülü (1,5) də qəbul edir, ona görə mətn xanasıdır. */
  kind: "text" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Seçim xanasında boş variantın yazısı. Verilməyibsə boş variant olmur. */
  emptyLabel?: string;
}

interface Props {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  fields: FormField[];
  submitLabel: string;
  hidden?: Record<string, string>;
}

export function EntityForm({ action, fields, submitLabel, hidden }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {hidden &&
        Object.entries(hidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const value = state.values?.[f.name];
          return (
            <label key={f.name} className="block space-y-1.5 text-sm font-medium">
              <span>{f.label}</span>
              {f.kind === "select" ? (
                <Select name={f.name} defaultValue={value ?? ""}>
                  {f.emptyLabel !== undefined && <option value="">{f.emptyLabel}</option>}
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  name={f.name}
                  type="text"
                  inputMode={f.kind === "number" ? "decimal" : undefined}
                  placeholder={f.placeholder}
                  defaultValue={value}
                  autoComplete="off"
                />
              )}
            </label>
          );
        })}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-brand">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : submitLabel}
      </Button>
    </form>
  );
}
