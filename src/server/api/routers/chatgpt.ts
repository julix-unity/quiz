import {
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { askChatGPT, parseQuestions } from "./prompt";
import { rethrowAsTRPCError } from "~/server/utils";

// re-export types for simpler import on frontend
export * from "./prompt/prompt.types";

export const chatgptRouter = createTRPCRouter({
  generateQuestions: protectedProcedure
    .input(z.object({ topic: z.string(), difficulty: z.string(), number: z.number() }))
    .mutation(async ({ input }) => {
      console.log("Received input:", input);

      const isFancy = true;
      try {
        const result = await askChatGPT(input, isFancy);
        const questions = parseQuestions(result);
        return questions;
      } catch (error) {
        rethrowAsTRPCError(error);
      }
    }),
});