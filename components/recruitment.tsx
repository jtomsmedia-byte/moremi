"use client";
import { useState, type FormEvent } from "react";
import { stages } from "@/lib/model";
import { post } from "./forms";
const steps = [
  {
    title: "About you",
    fields: [
      ["name", "Full name", "text"],
      ["email", "Email address", "email"],
      ["birth", "Date of birth", "date"],
      ["city", "City of residence", "text"],
    ],
  },
  {
    title: "Your ambition",
    fields: [
      ["stage", "Current work or study stage", "text"],
      ["goal", "What would you like to achieve in 90 days?", "textarea"],
    ],
  },
  {
    title: "Your contribution",
    fields: [
      ["availability", "When can you join online or in Lagos?", "text"],
      [
        "contribution",
        "How could you help someone in your circle?",
        "textarea",
      ],
    ],
  },
];
export function Recruitment() {
  const [stage, S] = useState(0),
    [step, T] = useState(0),
    [values, V] = useState<Record<string, string>>({}),
    [busy, B] = useState(false),
    [msg, M] = useState(""),
    [challenge, C] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) {
      T(step + 1);
      return;
    }
    B(true);
    try {
      if (!challenge) {
        C((await post("apply/code", { email: values.email })).id);
        M("Enter the code sent to your email.");
        return;
      }
      await post("apply", { ...values, challenge });
      T(4);
      M("");
    } catch (err) {
      M((err as Error).message);
    } finally {
      B(false);
    }
  }
  return (
    <div className="gridpair">
      <section className="panel">
        <p className="eyebrow">Programme map</p>
        <h2>Your 90 days</h2>
        <div className="flex flex-wrap gap-2">
          {stages.map((s, i) => (
            <button
              key={s.name}
              aria-pressed={i === stage}
              className={
                "rounded-full border px-4 py-2 " +
                (i === stage ? "bg-plum text-white" : "")
              }
              onClick={() => S(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="eyebrow">{stages[stage].days}</p>
        <h3>{stages[stage].promise}</h3>
        <p>{stages[stage].detail}</p>
        <p>
          <strong>Milestone. </strong>
          {stages[stage].criterion}
        </p>
        <hr />
        <p>
          Selection considers goal clarity, initiative, availability and
          willingness to give back. Membership is free and selective.
        </p>
      </section>
      <section className="panel" aria-live="polite">
        {step === 4 ? (
          <>
            <h2>Application received</h2>
            <p>
              The programme team reviews submissions. Selected applicants
              receive an invitation at their registered email.
            </p>
          </>
        ) : (
          <form className="stack" onSubmit={submit}>
            <p className="eyebrow">Application · {step + 1} of 4</p>
            <h2>{steps[step]?.title || "Review your application"}</h2>
            {step < 3 ? (
              steps[step].fields.map(([key, label, type]) => (
                <label key={key}>
                  {label}
                  {type === "textarea" ? (
                    <textarea
                      required
                      maxLength={500}
                      value={values[key] || ""}
                      onChange={(e) => V({ ...values, [key]: e.target.value })}
                    />
                  ) : (
                    <input
                      required
                      type={type}
                      maxLength={key === "email" ? 254 : 120}
                      value={values[key] || ""}
                      onChange={(e) => V({ ...values, [key]: e.target.value })}
                    />
                  )}
                </label>
              ))
            ) : (
              <>
                <dl>
                  {steps
                    .flatMap((s) => s.fields)
                    .map(([k, l]) => (
                      <div key={k} className="border-b py-2">
                        <dt className="text-xs">{l}</dt>
                        <dd className="break-words">{values[k]}</dd>
                      </div>
                    ))}
                </dl>
                <label className="flex items-start gap-2">
                  <input
                    className="w-auto"
                    type="checkbox"
                    required
                    checked={values.agreement === "yes"}
                    onChange={(e) =>
                      V({ ...values, agreement: e.target.checked ? "yes" : "" })
                    }
                  />
                  I agree that MCF may review these answers and contact me about
                  this application.
                </label>
              </>
            )}
            {step === 3 && challenge && (
              <label>
                Email verification code
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  onChange={(e) => V({ ...values, code: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => {
                    C("");
                    M("Request a new code below.");
                  }}
                >
                  Request another code
                </button>
              </label>
            )}
            <div className="flex gap-4">
              {step > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    T(step - 1);
                    C("");
                  }}
                >
                  Back
                </button>
              )}
              <button className="button" disabled={busy}>
                {step === 3
                  ? challenge
                    ? "Submit application"
                    : "Verify my email"
                  : "Continue"}
              </button>
            </div>
            <p role="status">{msg}</p>
          </form>
        )}
      </section>
    </div>
  );
}
