import { TRPCError } from "@trpc/server";

export const rethrowAsTRPCError = (error: unknown, fallbackCode: TRPCError["code"] = "INTERNAL_SERVER_ERROR"): never => {
  const isDevEnv = process.env.NODE_ENV === "development";
  let message = "Something went wrong.";

  if (error instanceof TRPCError) {
    console.error("Code:", error.code);
    console.error("Error:", error.message);
    console.error("Cause:", error.cause);
    if (isDevEnv) message = `Something went wrong: ${error.message}`;
  } else {
    console.error(error);
    if (isDevEnv) {
      message = `Something went wrong: ${error instanceof Error ? error.message : JSON.stringify(error)
        }`;
    }
  }

  throw new TRPCError({
    code: fallbackCode,
    message,
    cause: error instanceof Error ? error : undefined,
  });
};