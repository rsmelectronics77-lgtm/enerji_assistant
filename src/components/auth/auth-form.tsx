"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/features/auth/actions";

export interface Field {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
}

interface Props {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
}

export function AuthForm({ action, fields, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {fields.map((f) => (
        <label key={f.name} className="block space-y-1.5 text-sm font-medium">
          <span>{f.label}</span>
          <Input name={f.name} type={f.type} autoComplete={f.autoComplete} required />
        </label>
      ))}
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-brand">{state.message}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : submitLabel}
      </Button>
    </form>
  );
}
