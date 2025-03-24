import { TRPCError } from "@trpc/server";
import { quizSchema, type Questions } from "./prompt.types";

const extractJSONArray = (rawResponse: string): string => {
  const jsonMatch = rawResponse.match(/\[.*?\]/sg); // non-greedy match
  if (jsonMatch) return jsonMatch[0];

  throw new TRPCError({
    code: "PARSE_ERROR",
    message: "Failed to extract JSON array from response.",
  });
};


const parseJSON = (jsonString: string): unknown => {
  const parsed: unknown = JSON.parse(jsonString);

  if (!Array.isArray(parsed)) {
    throw new TRPCError({
      code: "PARSE_ERROR",
      message: "Parsed JSON is not an array.",
    });
  }

  return parsed;
};


const validateQuestions = (json: unknown): Questions => {
  const validation = quizSchema.shape.quiz.safeParse(json);
  if (!validation.success) {
    throw new TRPCError({
      code: "PARSE_ERROR",
      message: `Validation failed: ${JSON.stringify(validation.error.format())}`,
    });
  }

  return validation.data;
};

const addDefaultCorrectAnswer = (questions: Questions): Questions => {
  return questions.map((question) => {
    const hasCorrect = question.answers.some((ans) => ans.isCorrect);
    if (hasCorrect) return question;

    return {
      ...question,
      answers: [
        ...question.answers,
        {
          text: "None of these",
          explanation: "There wasn't a correct answer.",
          isCorrect: true,
        },
      ],
    };
  });
};

export const parseQuestions = (result: string): Questions => {
  try {
    const jsonString = extractJSONArray(result);
    const json = parseJSON(jsonString);
    const questions = validateQuestions(json);
    const questionsWithDefaults = addDefaultCorrectAnswer(questions);
    return questionsWithDefaults;
  } catch (error) {
    if (error instanceof TRPCError) {
      // TRPCError already has useful context, just rethrow
      throw error;
    }
    // Handle unexpected errors
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error during question parsing and validation.",
    });
  }
};
