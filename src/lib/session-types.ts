export type ExaminationQuestion = {
  id: number;
  position: number;
  text: string;
  choices: string[];
  guess: number | null;
};

export type ResultQuestion = ExaminationQuestion & {
  shortTitle: string;
  answer: number;
};
