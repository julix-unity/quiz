import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";
import type { PromptType } from "./prompt.types";

const cheapModel = 'gpt-3.5-turbo-0125';

const CheapQuestionSchema = {
  question: {
    text: "string" as string,
  },
  answers: [
    {
      text: "string" as string,
      explanation: "string" as string,
      isCorrect: false as boolean, // replaced as "boolean" in ChatGPT instruction
    },
  ],
};

const generatePrompt = ({ topic, difficulty, number }: PromptType) => (`
 You're generating domain specific questions for a self-testing and learning quiz app.
This Quiz should be on topic ${topic} and with a difficulty of ${difficulty}.

Please return a JSON object with "quiz" as key, containing an array of ${number} Objects matching ${JSON.stringify(CheapQuestionSchema).replace(/false/g, 'boolean')}

No formatting backticks, nothing else, your answer is directly parsed as a JSON string, so please be careful.
The explanation is only displayed to the user after they make a choice and serves to teach the quiz user (and allow for trickier questions)
`);

export const cheapParams = (input: PromptType): ChatCompletionCreateParamsNonStreaming => ({
  messages: [{ role: 'user', content: generatePrompt(input) }],
  model: cheapModel,
});
