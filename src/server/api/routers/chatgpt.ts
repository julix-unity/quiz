import {
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { askChatGPT, parseQuestions } from "./prompt";
import { rethrowAsTRPCError } from "~/server/utils";


export const chatgptRouter = createTRPCRouter({
  generateQuestions: protectedProcedure
    .input(z.object({ topic: z.string(), difficulty: z.string(), number: z.number() }))
    .mutation(async ({ input }) => {
      console.log("Received input:", input);

      try {
        const result = await askChatGPT(input, true); // set to false for non-fancy
        const questions = parseQuestions(result);
        return questions;
      } catch (error) {
        rethrowAsTRPCError(error);
      }
    }),
});