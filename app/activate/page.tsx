"use client";
import { useState } from "react";
import { ActionForm, Field, post } from "@/components/forms";
export default function Activate() {
  const [id, set] = useState("");
  return (
    <section className="panel mx-auto max-w-lg">
      <p className="eyebrow">Moremi Movement / private access</p>
      <h1 className="text-4xl">{id ? "Check your inbox" : "Member access"}</h1>
      {id ? (
        <>
          <ActionForm
            label="Verify code"
            run={async (f) => {
              const r = await post("auth/verify", { id, code: f.get("code") });
              location.replace(r.role === "admin" ? "/admin" : "/member");
            }}
          >
            <label>
              Six-digit email code
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                required
              />
            </label>
          </ActionForm>
          <button onClick={() => set("")}>Request another code</button>
        </>
      ) : (
        <ActionForm
          label="Send my code"
          run={async (f) =>
            set((await post("auth/request", Object.fromEntries(f))).id)
          }
        >
          <Field label="Registered email" name="email" type="email" />
          <Field
            label="Invitation token (first activation only)"
            name="token"
            optional
          />
          <small>
            Returning members and authorised staff can sign in with email.
          </small>
        </ActionForm>
      )}
    </section>
  );
}
