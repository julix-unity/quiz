"use client";

import { useState } from "react";
import { api } from "~/trpc/react"; // Use the `api` utility for tRPC
import type { Questions } from "~/server/api/routers/chatgpt";
import { Question } from "./_components/Question";


const ChatGPTTest = () => {
  const [results, setResults] = useState<Questions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState({ topic: "", difficulty: "", number: 1 });

  // const utils = api.useContext(); // Access tRPC utility for invalidation or other operations

  const generateQuestions = api.chatgpt.generateQuestions.useMutation({
    onSuccess: (data) => {
      console.log("Success:", data);
      setResults(data); // Store formatted result
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
    generateQuestions.mutate(input);
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
        <label>Number of Questions:</label>
        <input
          type="number"
          value={input.number}
          onChange={(e) =>
            setInput({ ...input, number: Number(e.target.value) })
          }
          className="w-full rounded-md px-4 py-2 text-black"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600"
          disabled={generateQuestions.isLoading}
        >
          {generateQuestions.isLoading ? "Generating..." : "Generate Question"}
        </button>
      </form>
      <br />

      {error && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h2 className="font-bold">Result: {error}</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      {results?.map(question => {
        return (
          <div key={question.question.text} className="mt-4 p-4 bg-blue-600 rounded-md">
            <Question question={question.question} answers={question.answers} />
          </div>
        )
      })}
    </div>
  );
};

export default ChatGPTTest;