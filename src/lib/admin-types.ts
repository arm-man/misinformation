export type Subject = {
  id: number;
  title: string;
  is_active: boolean;
};

export type Question = {
  id: number;
  subject_id: number;
  short_title: string;
  question_text: string;
  choice1: string;
  choice2: string;
  choice3: string | null;
  choice4: string | null;
  answer: number;
  explanation: string;
  why_it_spreads: string;
  sources: string;
  is_active: boolean;
};

export type QuestionInput = Omit<Question, "id" | "subject_id">;

export type QuestionTitle = Pick<Question, "id" | "subject_id" | "short_title">;
