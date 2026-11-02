export const stages = [
  {
    name: "LINK",
    days: "Days 1–30",
    promise: "Belong",
    detail: "Find your circle, meet a mentor and name one goal you can act on.",
    criterion: "Introduce yourself to the circle and confirm your goal.",
  },
  {
    name: "LEARN",
    days: "Days 31–60",
    promise: "Become",
    detail:
      "Bring a real challenge to seminars and founder conversations. Try one idea in your own work.",
    criterion: "Discuss a completed worksheet with your facilitator.",
  },
  {
    name: "LEAD",
    days: "Days 61–90",
    promise: "Build",
    detail:
      "Put your learning to work on a small project that helps someone in your community.",
    criterion: "Submit a case study and receive expert approval.",
  },
];
export const kinds = [
  "Seminar",
  "Founder",
  "Worksheet",
  "Meeting",
  "Stream",
  "Mentor",
  "Facilitator",
] as const;
export type Kind = (typeof kinds)[number];
export type Item = {
  id: number;
  kind: Kind;
  title: string;
  body: string;
  live: number;
};
export type Project = {
  id: number;
  title: string;
  status: string;
  feedback: string;
};
export type Snapshot = {
  name: string;
  day: number;
  items: Item[];
  messages: { id: number; name: string; body: string }[];
  progress: string[];
  projects: Project[];
  applicants: {
    name: string;
    email: string;
    status: string;
    answers: string;
  }[];
  members: { email: string; name: string; done: string }[];
  metrics: number[];
};
