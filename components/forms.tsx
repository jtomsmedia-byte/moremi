"use client";
import { useState, type FormEvent, type ReactNode } from "react";

export async function post(path: string, body: object | FormData) {
  const file = body instanceof FormData;
  const response = await fetch("/api/" + path, {
    method: "POST",
    headers: file ? {} : { "Content-Type": "application/json" },
    body: file ? body : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Request failed.");
  return data;
}

export function ActionForm({
  run,
  children,
  label,
  success = "",
  reset = false,
}: {
  run: (f: FormData) => Promise<unknown>;
  children?: ReactNode;
  label?: string; // Made optional
  success?: string;
  reset?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [msg, setMsg] = useState("");
    
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMsg("");
    try {
      await run(new FormData(form));
      setMsg(success);
      if (reset) form.reset();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  }
  
  return (
    <form className="stack" onSubmit={submit}>
      <fieldset disabled={busy} className="stack">
        {children}
        {/* Only show default button if label is provided */}
        {label && <button className="button">{busy ? "Working…" : label}</button>}
      </fieldset>
      {msg && <p role="status" className="text-sm font-bold text-stone-500">{msg}</p>}
    </form>
  );
}

export function Field({
  name,
  label,
  type = "text",
  optional = false,
}: {
  name: string;
  label: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={!optional}
        maxLength={type === "email" ? 254 : 120}
      />
    </label>
  );
}

export function Lead() {
  return (
    <section className="panel">
      <h2>Hear about the Lagos intake</h2>
      <ActionForm
        label="Register my interest"
        reset
        success="Interest registered. Apply separately to be considered for M90."
        run={(f) => post("lead", Object.fromEntries(f))}
      >
        <Field name="name" label="Your name" />
        <Field name="email" label="Email" type="email" />
        <small className="text-stone-500 font-medium">MCF may contact you about this intake.</small>
      </ActionForm>
    </section>
  );
}