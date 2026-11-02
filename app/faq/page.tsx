import Link from "next/link";
const questions = [
  [
    "Who can apply?",
    "The founding intake is for young people aged 18–35 at the cohort start. The pilot begins in Lagos.",
  ],
  [
    "What does membership cost?",
    "Membership is free. The programme team selects participants through an application review.",
  ],
  [
    "Does MCF offer seed funding or jobs?",
    "M90 offers mentors, learning sessions and opportunities to contribute. A place does not guarantee funding or employment.",
  ],
  [
    "How much time should I set aside?",
    "Plan to take part across the full 90 days. Tell us your availability so the team can discuss session commitments before activation.",
  ],
  [
    "How do I enter the member portal?",
    "Selected applicants receive a private invitation. Enter the token and verify the code sent to the email on your application.",
  ],
  [
    "What works offline?",
    "Members can save selected PDF worksheets on a personal device. Chat, meetings and submissions require a connection.",
  ],
];
export default function FAQ() {
  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <p className="eyebrow">Applicant guide</p>
      <h1>Common questions</h1>
      {questions.map(([q, a]) => (
        <details key={q} className="panel">
          <summary className="font-semibold">{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <Link className="button" href="/program">
        Explore the programme
      </Link>
    </section>
  );
}
