"use client"
import { createContext, useContext, useState, useEffect, type ReactElement } from 'react';
import { api } from "~/trpc/react";

type TokenContextType = {
    tokenCap: number;
    tokensUsed: number;
    incrementTokenCap: (amount: number) => void;
    incrementTokensUsed: (amount: number) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useTokens = () => useContext(TokenContext);

export const TokenProvider = ({ children }: {children: ReactElement}) => {
  const {isLoading, data} = api.user.getTokenStats.useQuery();

  const [tokenCap, setTokenCap] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);

  // Fetch token stats from API on component mount
  useEffect(() => {
    console.log(data);    

    if (!isLoading && data) {

      const currentCap = data.tokenCap;
      const currentUsed = data.tokensUsed;

      setTokenCap(currentCap);
      setTokensUsed(currentUsed);
    }
  }, [isLoading, data]);

//   const decrementTokens = () => setTokens(prev => prev - 1);
  const incrementTokenCap = (amount:number ) => setTokenCap(prev => prev + amount);
  const incrementTokensUsed = (amount:number ) => setTokensUsed(prev => prev + amount);

  return (
    <TokenContext.Provider value={{ tokenCap, tokensUsed, /*decrementTokens,*/ incrementTokenCap, incrementTokensUsed }}>
      {children}
    </TokenContext.Provider>
  );
};
