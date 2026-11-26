export type LandingSubject = {
  id: number;
  title: string;
  description: string | null;
  status: "not-started" | "in-progress" | "complete";
};
