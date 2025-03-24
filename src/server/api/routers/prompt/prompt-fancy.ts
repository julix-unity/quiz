import { zodResponseFormat } from "openai/helpers/zod";
import { quizSchema, type PromptType } from "./prompt.types";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

const fancyModel = 'gpt-4o';

const generatePrompt = ({ topic, difficulty, number }: { topic: string, difficulty: string, number: number }) => {
  return `
    You're generating domain specific questions for a self-testing and learning quiz app.
  
    Their topic shall be: ${topic}
    Their difficulty: ${difficulty}
    Their quantity a number of: ${number}
   
    Note the explanation is only displayed to the user *after* they select an answer and serves to teach the quiz user, even if they guessed (and thus allow for trickier questions)
    The quiz is not graded, so worry less about fairness and more about the user's learning and growth.
    `;
}


export const fancyParams = (input: PromptType): ChatCompletionCreateParamsNonStreaming => ({
  messages: [{ role: 'user', content: generatePrompt(input) }],
  model: fancyModel,
  response_format: zodResponseFormat(quizSchema, "questions")
});