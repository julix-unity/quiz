import {
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { askChatGPT, parseQuestions } from "./prompt";
import type { GPTResult } from "./prompt/prompt";
import { rethrowAsTRPCError } from "~/server/utils";
import { TRPCError } from "@trpc/server";

// re-export types for simpler import on frontend
export * from "./prompt/prompt.types";

// Simple per-user in-memory rate limiter (per-process)
const rlHits = new Map<string, { count: number; windowStart: number }>();
const RL_WINDOW_MS = 60 * 1000; // 1 minute
const RL_MAX_REQUESTS = 6;

const checkRateLimit = (userId: string) => {
  const now = Date.now();
  const current = rlHits.get(userId) ?? { count: 0, windowStart: now };
  if (now - current.windowStart > RL_WINDOW_MS) {
    rlHits.set(userId, { count: 1, windowStart: now });
    return;
  }
  if (current.count + 1 > RL_MAX_REQUESTS) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please slow down. Try again in a minute." });
  }
  rlHits.set(userId, { ...current, count: current.count + 1 });
};

export const chatgptRouter = createTRPCRouter({
  generateQuestions: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(1).max(120),
        difficulty: z.string().min(1).max(60),
        number: z.number().int().min(1).max(10),
        quality: z.enum(["cheap", "fancy"]).optional().default("fancy"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const { topic, difficulty, number, quality } = input;

      // Rate limit
      checkRateLimit(userId);

      // Quota check
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { tokensUsed: true, tokenCap: true },
      });
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (user.tokensUsed >= user.tokenCap) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token cap reached. Try again later." });
      }

      const isFancy = quality === "fancy";

      try {
        const result: GPTResult = await askChatGPT({ topic, difficulty, number }, isFancy);
        const text = result.text;
        const usage = result.usage;
        const questions = parseQuestions(text);

        // Persist token usage (best-effort)
        const totalTokens = usage?.total ?? 0;
        if (totalTokens > 0) {
          await ctx.db.user.update({
            where: { id: userId },
            data: {
              tokensUsed: { increment: totalTokens },
              quizzesCreated: { increment: 1 },
            },
          });
        } else {
          await ctx.db.user.update({
            where: { id: userId },
            data: { quizzesCreated: { increment: 1 } },
          });
        }

        return questions;
      } catch (error: unknown) {
        rethrowAsTRPCError(error);
      }
    }),
});