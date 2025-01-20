"use client";

import type { ChatGPTResponse } from "~/server/api/routers/chatgpt";
import { useState } from "react";

export function Question({question, answers}: ChatGPTResponse) {

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const handleAnswerClick = (selectedText: string) => {
    setSelectedAnswer(selectedText);
    setShowExplanation(true); // Reveal explanation on selection
  };

  return (
    <div className="w-full max-w-xs">
      <fieldset>
        <legend>{question}</legend>
        <br />
        {answers?.map(answer => {
          const {text } = answer;
          const isSelected = selectedAnswer === text;
          return (
            <div key={answer.text} className="flex items-center space-x-2">
              <input
                type="radio"
                id={text}
                name="quiz-option"
                value={text}
                checked={isSelected}
                onChange={() => handleAnswerClick(text)}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor={text}>{text}</label>
            </div>
          )
        })}
        {showExplanation && selectedAnswer && (
          <div className="mt-4 p-2 border-l-4" style={{ borderColor: answers.find(a => a.text === selectedAnswer)?.isCorrect ? 'green' : 'red' }}>
            <p className="font-semibold">{answers.find(a => a.text === selectedAnswer)?.isCorrect ? '✅ Correct!' : '❌ Incorrect'}</p>
            <p>{answers.find(a => a.text === selectedAnswer)?.explanation}</p>
          </div>
        )}
      </fieldset>
    </div>
  );
}
