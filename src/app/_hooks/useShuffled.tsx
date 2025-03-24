import { useState, useEffect } from "react";

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]; // Create a shallow copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]; // ! Asserts non-null
  }
  return shuffled;
};

/**
 * Custom hook to shuffle an array while keeping it stable between renders.
 */
const useShuffled = <T,>(array: T[]): T[] => {
  const [shuffled, setShuffled] = useState<T[]>([]);

  useEffect(() => {
    setShuffled(shuffleArray(array));
  }, [array]); // Reshuffle only if the array changes

  return shuffled;
};

export default useShuffled;
