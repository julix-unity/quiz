import { z } from "zod";

export const quizSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.object({
        text: z.string(),
      }),
      answers: z.array(
        z.object({
          text: z.string(),
          explanation: z.string(),
          isCorrect: z.boolean(),
        })
      ),
    })
  ),
});

export type Question = z.infer<typeof quizSchema.shape.quiz.element>;
export type Questions = Question[];

export type Answers = Question['answers'];
export type Answer = Answers[number];

export type PromptType = {
  topic: string;
  difficulty: string; 
  number: number;
}
