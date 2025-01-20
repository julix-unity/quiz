"use client";

import { useState } from "react";
import { api } from "~/trpc/react"; // Use the `api` utility for tRPC
import type { ChatGPTResponse } from "~/server/api/routers/chatgpt";
import { Question } from "./_components/Question";


const ChatGPTTest = () => {
  const [result, setResult] = useState<ChatGPTResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState({ topic: "", difficulty: "" });

  // const utils = api.useContext(); // Access tRPC utility for invalidation or other operations

  const generateQuestion = api.chatgpt.generateQuestion.useMutation({
    onSuccess: (data) => {
      console.log("Success:", data);
      setResult(data); // Store formatted result
    },
    onError: (error) => {
      console.error("Error:", error);
      setError(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.topic || !input.difficulty) {
      setError("Please provide both a topic and difficulty.");
      return;
    }
    generateQuestion.mutate(input);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">ChatGPT Quiz Question</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>Topic:</label>
        <input
          type="text"
          placeholder="Topic (e.g., JavaScript)"
          value={input.topic}
          onChange={(e) => setInput({ ...input, topic: e.target.value })}
          className="w-full rounded-md px-4 py-2 text-black"
        />
        <label>Difficulty:</label>
        <input
          type="text"
          placeholder="Difficulty (e.g., easy, medium, hard)"
          value={input.difficulty}
          onChange={(e) =>
            setInput({ ...input, difficulty: e.target.value })
          }
          className="w-full rounded-md px-4 py-2 text-black"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600"
          disabled={generateQuestion.isLoading}
        >
          {generateQuestion.isLoading ? "Generating..." : "Generate Question"}
        </button>
      </form>
      <br />

      {error && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h2 className="font-bold">Result: {error}</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      {result && (
        <div className="mt-4 p-4 bg-blue-600 rounded-md">
          <Question question={result.question} answers={result.answers} />
        </div>
      )}
    </div>
  );
};

export default ChatGPTTest;