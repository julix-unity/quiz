"use client";

import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react"; // Use the `api` utility for tRPC
import type { Questions } from "~/server/api/routers/chatgpt";
import { Question } from "./_components/Question";
import { useTokens } from "./TokenProvider";

const Card = ({ children }: { children: ReactNode }) => <div className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">{children}</div>

const QuizForm = () => {
  const [results, setResults] = useState<Questions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState({ topic: "", difficulty: "", number: 1 });
  const [onCoolDown, setOnCoolDown] = useState(false);

  const { tokens, decrementTokens }  = useTokens();

  // const utils = api.useContext(); // Access tRPC utility for invalidation or other operations

  const generateQuestions = api.chatgpt.generateQuestions.useMutation({
    onSuccess: (data) => {
      console.log("Success:", data);
      setError(null);
      setOnCoolDown(true);
      setResults(data); // Store formatted result

      // turn off cool down some seconds later
      setTimeout(() => setOnCoolDown(false), 10 * 1000);
    },
    onError: (error) => {
      console.error("Error:", error);
      setError(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.topic || !input.difficulty || !input.number) {
      setError("Please provide both a topic and difficulty.");
      return;
    }
    if (onCoolDown) {
      // setError("What's the rush? These questions were expensive to generate, savour them more!"); // too worried about clearing valid errors on unset
      return;
    }
    generateQuestions.mutate(input);
  };


  const isSending = generateQuestions.isPending;
  const isReady = !isSending && !onCoolDown;

  const isSubmitted = generateQuestions.isPending || !!results;

  return (<>
    <motion.div
      initial={{ x: "50%", width: "50%", borderRadius: 12 }}
      animate={{
        x: isSubmitted ? "calc(-50vw + 200px)" : "0", // Moves left
        width: isSubmitted ? "400px" : "400px", // Shrinks width
        height: isSubmitted ? "100vh" : "auto", // Expands to full height
        borderRadius: isSubmitted ? 0 : 12, // Removes rounded edges
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="absolute p-6 bg-gray-800"
    >
      <Card>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Create <span className="text-quiz-gold">your</span> gentle quiz</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label>Topic:</label>
          <input
            type="text"
            placeholder="As specific or broad as you like"
            value={input.topic}
            onChange={(e) => setInput({ ...input, topic: e.target.value })}
            className="w-full rounded-md px-4 py-2 text-black"
          />
          <label>Difficulty:</label>
          <input
            type="text"
            placeholder="2/7, Hell Freezing Over, Easy?"
            value={input.difficulty}
            onChange={(e) =>
              setInput({ ...input, difficulty: e.target.value })
            }
            className="w-full rounded-md px-4 py-2 text-black"
          />
          <label>Number of Questions:</label>
          <input
            type="number"
            value={input.number}
            min="1" max="10"
            onChange={(e) =>
              setInput({ ...input, number: Number(e.target.value) })
            }
            className="w-full rounded-md px-4 py-2 text-black"
          />
          <button
            type="submit"
            className={`rounded-md px-4 py-2 text-white font-semibold ${isReady && 'bg-quiz-green hover:bg-quiz-gold'} ${isSending && 'cursor-progress bg-quiz-dark'} ${onCoolDown && 'bg-quiz-green'}`}
            disabled={generateQuestions.isPending || onCoolDown}
          >
            {generateQuestions.isPending ? <>
              <div role="status">
                <svg aria-hidden="true" className="inline w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                Generating...
              </div>
            </> : (onCoolDown ? "Enjoy!" : "Generate Question")}
          </button>
          <hr />
          <p>Tokens left: {tokens}</p>
        </form>
        <br />

        {error && (
          <div className="mt-4 p-4 bg-gray-900 rounded-md">
            <h2 className="font-bold">Result: {error}</h2>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </Card>
    </motion.div>
    {results?.map(question => {
      return (
        <Card key={question.question.text}>
          <Question question={question.question} answers={question.answers} />
        </Card>
      )
    })}
  </>

  );
};

export default QuizForm;
