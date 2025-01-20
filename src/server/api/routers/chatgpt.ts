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

export type ChatGPTResponse = {
  question: string;
  answers: {
    text: string;
    explanation: string;
    isCorrect: boolean;
  }[];
}

const extractJSON = (rawResponse: string): string => {
  const jsonMatch = rawResponse.match(/\{.*\}/sg); // Matches the first valid JSON block
  if (jsonMatch) {
    return jsonMatch[0]; // Return the matched JSON string
  }
  throw new Error("No valid JSON found in OpenAI response.");
}

export const chatgptRouter = createTRPCRouter({
  generateQuestion: publicProcedure
    .input(z.object({ topic: z.string(), difficulty: z.string() }))
    .mutation(async ({ input }) => {
      console.log("Received input:", input);
      const { topic, difficulty } = input;

      const content = `
You're generating questions for a quiz app, one at a time, to help a senior developer test his coding skills.

This question should be on topic ${topic} and with a difficulty of ${difficulty}.
Return ONLY a JSON matching this schema {question: string, answers: {text: string, explanation: string, isCorrect: boolean}[]}
No formatting backticks, nothing else, your answer is directly parsed as a JSON string, so please be careful.
The explanation is only displayed to the user after they make a choice and serves to teach the quiz user (and allow for trickier questions)
`;     

      let result: string;
      try {
        result = await askChatGPT(content);
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
        const parsed = JSON.parse(extracted) as ChatGPTResponse;
        console.log(parsed);
        return parsed;
      } catch (error) {
        console.error("JSON parsing error!", result, error);
        return {
          question: "Failed to parse question.",
          answers: [],
        };
      }
    }),
});