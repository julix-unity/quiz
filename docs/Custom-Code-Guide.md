# Custom Code Guide (T3 Stack)

This document maps the custom code in `src/` so you can quickly find how things work end-to-end.

## Server: tRPC API

- **Router composition**: `src/server/api/root.ts`
  - Exposes `post`, `chatgpt`, `user` routers via `appRouter`.
  - Exports `createCaller` for RSC/SSR usage.

- **tRPC setup**: `src/server/api/trpc.ts`
  - `createTRPCContext` attaches `db` and `session` (via NextAuth) to ctx.
  - `publicProcedure` and `protectedProcedure` with timing middleware.
  - SuperJSON transformer + Zod error formatting.

- **Routers**: `src/server/api/routers/`
  - `post.ts`: demo CRUD-ish endpoints
    - `hello`, `create`, `getLatest`, `getSecretMessage`.
  - `user.ts`: authenticated user info
    - `getTokenStats` returns `tokensUsed` and `tokenCap` from Prisma `User`.
  - `chatgpt.ts`: quiz generation flow
    - `generateQuestions` (protected): calls `askChatGPT` then `parseQuestions`.
    - Re-exports prompt types for front-end typing.

## OpenAI Prompting and Parsing

- Location: `src/server/api/routers/prompt/`
  - `prompt.types.ts`: Zod schema `quizSchema` and TS types `Question`, `Questions`, etc.
  - `prompt.ts`: OpenAI client, `askChatGPT(input, isFancy)` selecting params and calling GPT.
  - `prompt-cheap.ts`: `cheapParams` for `gpt-4o-mini-2024-07-18` with a structured JSON instruction.
  - `prompt-fancy.ts`: `fancyParams` for `gpt-4o` using `zodResponseFormat(quizSchema, "questions")`.
  - `parseQuestions.ts`: robust extraction and validation pipeline
    - Extract outermost JSON array from the model text
    - Parse JSON, validate with Zod against `quizSchema.quiz`
    - Ensure a default correct answer exists (adds "None of these" if none flagged)

## Auth

- **NextAuth**: `src/server/auth/`
  - `config.ts`: Prisma adapter, Discord provider, session callback adds `user.id`.
  - `index.ts`: wraps NextAuth and caches `auth`; exports `{ handlers, signIn, signOut }`.
  - API route wiring: `src/app/api/auth/[...nextauth]/route.ts` exports `{ GET, POST } = handlers`.

## Database

- **Prisma client**: `src/server/db.ts` (singleton per dev process, env-aware logging)
- **Schema**: `prisma/schema.prisma`
  - Models: `User` (with `tokenCap`, `tokensUsed`, `quizzesCreated`), `Post`, `Account`, `Session`, `VerificationToken`.

## tRPC Runtime integration

- **App Router HTTP**: `src/app/api/trpc/[trpc]/route.ts`
  - `fetchRequestHandler` with `appRouter` and `createTRPCContext`.
- **React Server Components**: `src/trpc/server.ts`
  - `createHydrationHelpers` with `createCaller(createContext)` and `createQueryClient`.
  - Exports `api` (RSC proxy) and `HydrateClient`.
- **Client hooks**: `src/trpc/react.tsx`
  - `api` from `createTRPCReact<AppRouter>()`
  - `TRPCReactProvider` with `unstable_httpBatchStreamLink` and SuperJSON.
  - `RouterInputs`/`RouterOutputs` helpers.
  - Query client singleton on the browser.

## App UI (Next.js App Router)

- **Layout**: `src/app/layout.tsx`
  - Loads Tailwind, sets metadata/icons, wraps children in `TRPCReactProvider`.

- **Home page**: `src/app/page.tsx`
  - Reads session via `auth()`.
  - Prefetches latest post if logged in; shows sign-in/out link.
  - Renders `<QuizForm />` when authenticated.

- **Quiz**: `src/app/QuizForm.tsx`
  - Local state for prompt input and results.
  - Uses `api.chatgpt.generateQuestions.useMutation()`.
  - Cooldown UX to limit rapid re-submits.
  - Displays token usage from `useTokenStats()`.
  - Renders each question via `<Question />` inside a `Card`.

- **Question component**: `src/app/_components/Question.tsx`
  - Props use shared types from `chatgpt` router exports.
  - Shuffles answers with `useShuffled`.
  - Shows correctness and explanation after selection.

- **Demo post widget**: `src/app/_components/post.tsx`
  - `LatestPost` example using `api.post` queries/mutations with invalidation.

## Custom Hooks

- `src/app/_hooks/useShuffled.tsx`
  - Stable shuffle per input array changes (Fisher-Yates on copy).
- `src/app/_hooks/useTokenStats.tsx`
  - Wraps `api.user.getTokenStats.useQuery` with a 5-minute `staleTime` and returns cap/used.

## Utilities

- `src/server/utils/rethrowAsTRPCError.ts`
  - Converts unknown errors into `TRPCError` with dev-friendly messages; logs details in dev.
  - Re-exported from `src/server/utils/index.ts`.

## Environment

- `src/env.js`
  - Validates server env vars (AUTH_*, DATABASE_URL, NODE_ENV) with `@t3-oss/env-nextjs`.

## Notes and Conventions

- Types: Frontend imports quiz types from `chatgpt` router re-exports to stay in sync with server Zod schema.
- OpenAI: Set `OPENAI_API_KEY` in env; choose cheap vs fancy prompting via `isFancy` flag in `chatgpt.ts`.
- AuthZ: Use `protectedProcedure` for any endpoint requiring a logged-in user. `ctx.session.user` is guaranteed.
- Data Fetching: Prefer `api.*` hooks in client components and `api` from `src/trpc/server` in RSCs.
