import {
    createTRPCRouter,
    // protectedProcedure,
    publicProcedure,
  } from "~/server/api/trpc";

import { z } from "zod";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined");
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const openai = new OpenAI({ apiKey });

async function askChatGPT(content = 'Say this is test'): Promise<string> {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content }],
      model: 'gpt-4o',
    });
    const result = chatCompletion.choices[0]?.message?.content ?? 'No response';
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to get a response from OpenAI.');
  }
}

// runtime value to be able to share with ChatGPT
const QuestionSchema = {
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

// Type version of runtime value
export type Question = typeof QuestionSchema;
export type Questions = Question[];

// export type ChatGPTResponse = typeof chatGPTResponseSchema;

const extractJSON = (rawResponse: string): string => {
  // const jsonMatch = rawResponse.match(/\{.*\}/sg); // Matches the first valid JSON block
  const jsonMatch = rawResponse.match(/\[.*\]/sg); // Matches the first valid JSON block
  if (jsonMatch) {
    return jsonMatch[0]; // Return the matched JSON string
  }
  throw new Error("No valid JSON found in OpenAI response.");
}



const generatePrompt = ({topic, difficulty, number}: {topic: string, difficulty: string, number: number}) => {
  return `
  You're generating questions for a quiz app, to help a senior developer test his coding skills.
  
  This question should be on topic ${topic} and with a difficulty of ${difficulty}.
  Return ONLY an array of ${number} questions in JSON, like ${JSON.stringify(QuestionSchema).replace(/false/g, 'boolean')}[]

  no formatting backticks, nothing else, your answer is directly parsed as a JSON string, so please be careful.
  The explanation is only displayed to the user after they make a choice and serves to teach the quiz user (and allow for trickier questions)
  `;
}

export const chatgptRouter = createTRPCRouter({
  generateQuestions: publicProcedure
    .input(z.object({ topic: z.string(), difficulty: z.string(), number: z.number() }))
    .mutation(async ({ input }) => {
      console.log("Received input:", input);

      const prompt = generatePrompt(input);

      let result: string;
      try {
        result = await askChatGPT(prompt);
        console.log("OpenAI response:", result);
      } catch (error) {
        console.error("OpenAI API error:", error);
        return {
          question: "Failed to generate question.",
          answers: [],
        };
      }

      try {
        const extracted = extractJSON(result);
        const parsedQuestions = JSON.parse(extracted) as Questions;

        // debug, if no correct answers are provided, add a "None of these" option
        const questions = parsedQuestions.map(question => {
          const found = question.answers.some(answer => answer.isCorrect)
          if (!found) {
            question.answers.push({
              text: 'None of these',
              explanation: "There wasn't a correct answer.",
              isCorrect: true,
            })
          }
          return question;
        })

        return questions;
      } catch (error) {
        console.error("JSON parsing error!", result, error);
        return {
          question: "Failed to parse question.",
          answers: [],
        };
      }
    }),
});