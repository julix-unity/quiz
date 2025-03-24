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

const promptGPT = async (params: ChatCompletionCreateParamsNonStreaming, thing = "thing being generated"): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create(params);
    const result = completion.choices[0]?.message?.content ?? 'No response';
    console.log("OpenAI API response: \n", result);
    return result;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to generate ${thing}.`,
    });
  }
};

export const askChatGPT = async (input: PromptType, isFancy = false): Promise<string> => {
  const params: ChatCompletionCreateParamsNonStreaming = isFancy ? fancyParams(input) : cheapParams(input);
  return promptGPT(params, "quiz question");
}
