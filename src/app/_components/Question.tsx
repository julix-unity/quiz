"use client";

import type { Question } from "~/server/api/routers/chatgpt";
import { useState } from "react";
import useShuffled from "../_hooks/useShuffled";

export function Question({question, answers}: Question) {

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const handleAnswerClick = (selectedText: string) => {
    setSelectedAnswer(selectedText);
    setShowExplanation(true); // Reveal explanation on selection
  };

  const shuffledAnswers = useShuffled(answers);

  return (
    <div className="w-full max-w-xs">
      <fieldset>
        <legend>{question.text}</legend>
        <br />
        {shuffledAnswers?.map(answer => {
          const {text} = answer;
          const isSelected = selectedAnswer === text;
          return (
            <div key={answer.text} className="flex gap-3 cursor-pointer mb-2">
              <input
                type="radio"
                id={text}
                name={question.text}
                value={text}
                checked={isSelected}
                onChange={() => handleAnswerClick(text)}
                className="h-6"
              />
              <label htmlFor={text}>{text}</label>
            </div>
          )
        })}
        {showExplanation && selectedAnswer && (
          <div className="mt-4 p-4 bg-gray-900 rounded-md border-l-4" style={{ borderColor: answers.find(a => a.text === selectedAnswer)?.isCorrect ? 'green' : 'red' }}>
            <p className="font-semibold">{answers.find(a => a.text === selectedAnswer)?.isCorrect ? '✅ Correct!' : '❌ Incorrect'}</p>
            <p>{answers.find(a => a.text === selectedAnswer)?.explanation}</p>
          </div>
        )}
      </fieldset>
    </div>
  );
}
