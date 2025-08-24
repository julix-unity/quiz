import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";
import type { PromptType } from "./prompt.types";
import { fancyParams } from "./prompt-fancy";
import { cheapParams } from "./prompt-cheap";
import { TRPCError } from "@trpc/server";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not defined");
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const openai = new OpenAI({ apiKey });

type Usage = { prompt: number; completion: number; total: number };
export type GPTResult = { text: string; usage: Usage | undefined };

const promptGPT = async (params: ChatCompletionCreateParamsNonStreaming, thing = "thing being generated"): Promise<GPTResult> => {
  try {
    const completion = await openai.chat.completions.create(params);
    const text = completion.choices[0]?.message?.content ?? 'No response';
    console.log("OpenAI API response: \n", text);
    const usage: Usage | undefined = completion.usage
      ? {
          prompt: completion.usage.prompt_tokens ?? 0,
          completion: completion.usage.completion_tokens ?? 0,
          total: completion.usage.total_tokens ?? 0,
        }
      : undefined;
    return { text, usage };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to generate ${thing}.`,
    });
  }
};

export const askChatGPT = async (input: PromptType, isFancy = false): Promise<GPTResult> => {
  const params: ChatCompletionCreateParamsNonStreaming = isFancy ? fancyParams(input) : cheapParams(input);
  return promptGPT(params, "quiz question");
}
