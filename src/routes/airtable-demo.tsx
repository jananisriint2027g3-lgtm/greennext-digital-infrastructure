import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

import { submitAirtablePocLead } from "../lib/airtable-poc.server-fn";

type FormState = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  region: string;
  inquiryType: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  region: "",
  inquiryType: "",
  message: "",
};

export const Route = createFileRoute("/airtable-demo")({
  head: () => ({
    meta: [{ title: "Airtable Demo | GreenNext" }],
  }),
  component: AirtableDemoPage,
});

function AirtableDemoPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");

    try {
      const result = await submitAirtablePocLead({ data: form });
      setStatus(result.success ? "success" : "failed");
      if (result.success) setForm(initialForm);
    } catch {
      setStatus("failed");
    }
  };

  return (
    <main className="min-h-screen bg-[#070A0E] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-xs font-mono uppercase tracking-widest text-[#10B981]">
          Airtable proof of concept
        </p>
        <h1 className="mb-3 text-3xl font-bold">Create a demo lead record</h1>
        <p className="mb-8 text-sm leading-relaxed text-[#94A3B8]">
          This isolated demo stores one submitted lead in Airtable. It does not affect the normal
          GreenNext inquiry workflow.
        </p>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.name} required onChange={(value) => update("name", value)} />
            <Field label="Email" type="email" value={form.email} required onChange={(value) => update("email", value)} />
            <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} />
            <Field label="Organization" value={form.organization} onChange={(value) => update("organization", value)} />
            <Field label="Region" value={form.region} onChange={(value) => update("region", value)} />
            <Field label="Inquiry Type" value={form.inquiryType} required onChange={(value) => update("inquiryType", value)} />
          </div>
          <label className="block text-sm text-[#CBD5E1]">
            Message
            <textarea
              required
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="mt-1 min-h-32 w-full rounded-lg border border-[#334155] bg-[#121824] px-3 py-2 text-sm text-white outline-none focus:border-[#10B981]"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-lg bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-[#070A0E] disabled:opacity-50"
          >
            {status === "loading" ? "Submitting…" : "Submit to Airtable"}
          </button>
          {status === "success" && <p className="text-sm text-[#86EFAC]">Airtable record created successfully.</p>}
          {status === "failed" && <p className="text-sm text-[#FCA5A5]">Airtable record creation failed.</p>}
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  required = false,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-[#CBD5E1]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[#334155] bg-[#121824] px-3 py-2 text-sm text-white outline-none focus:border-[#10B981]"
      />
    </label>
  );
}
