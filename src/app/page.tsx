import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import QuizForm from "./QuizForm";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-quiz-blue to-quiz-dark text-white">
        {/* The main content */}
        {session?.user && <QuizForm session={session} />}
      </main>
    </HydrateClient>
  );
}
