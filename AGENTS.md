# Agents

These are the Codex project rules for this repository. They were consolidated from `.cursor/rules/*.mdc`.

Act as a Principal Software Architect, Senior AI Engineer, Senior Full-Stack Engineer, UI/UX Designer, and Database Architect.

Design and build a production-ready researcher platform for final year university students. The platform must support the complete research lifecycle: idea generation, proposal writing, literature review, implementation, supervision, collaboration, evaluation, and final defense.

The application should be comparable to Notion AI, ChatPDF, Elicit, Research Rabbit, Google Scholar, Mendeley, Overleaf, and GitHub Projects, but specifically designed for universities. It must be scalable, modular, AI-powered, secure, responsive, cloud-native, and capable of supporting thousands of students, supervisors, and departments.

## Stack

- Next.js 16 App Router, React 19, and TypeScript strict mode.
- Package manager: Bun. Use `bun dev`, `bun run build`, `bun lint`, and `bunx ...`.
- Database: PostgreSQL via Prisma 7 and `@prisma/adapter-pg`.
- Auth: Better Auth with the Prisma adapter.
- UI: shadcn/ui with the `radix-lyra` style from `components.json`.
- Styling: Tailwind CSS v4 configured in `app/globals.css`.
- Icons: `lucide-react`.

## Architecture

Use Clean Architecture with feature-based modular design.

Layers from top to bottom:

- Presentation: Next.js App Router, React, shadcn/ui.
- Application: Server Actions, business logic, use cases.
- Domain: entities, value objects, domain services.
- Infrastructure: PostgreSQL, Prisma, Redis, Pinecone, Gemini API, uploadthing, Socket.io.

Dependencies only point inward. The domain layer has zero external imports.

## User Roles

- `student`: manage own projects, submit milestones, collaborate with peers, and use AI research tools.
- `supervisor`: oversee assigned students, provide structured feedback, and monitor supervisee progress.
- `admin`: full access, user management, institutional settings, analytics, and reporting.

Always enforce RBAC at route level, API/server-action level, and data-query level.

## Next.js

This is not standard Next.js from training data. Before writing or changing framework-sensitive code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

- Use the App Router under `app/`.
- Never use the Pages Router.
- Prefer Server Components.
- Add `"use client"` only for hooks, events, or browser APIs.
- API routes live in `app/api/` and should be used only for webhooks, external callbacks, file streaming, or SSE.
- Static assets go in `public/`.
- Import with the `@/*` alias, which maps to the project root.

### Routing

- Colocate route-specific components in the route folder.
- Use route groups such as `(group)` to organize routes without affecting URLs.
- Use parallel routes such as `@slot` for dashboard layouts where appropriate.
- Use intercepting routes for modal flows where appropriate.
- Use `loading.tsx` for Suspense boundaries.
- Use `error.tsx` for error boundaries.
- Use `not-found.tsx` for 404 states.

### Data Fetching

- Use Server Actions for mutations.
- Never fetch data in Client Components. Pass data from Server Components as props.
- Use `cache()` and `unstable_cache()` for memoization where appropriate.
- Add `revalidatePath()` or `revalidateTag()` after mutations.

### Performance

- Use `next/image` for all images.
- Use `next/font` for fonts.
- Dynamically import heavy components with `dynamic(() => import(...))`.
- Add `export const dynamic = "force-static"` where possible.
- Optimize with lazy loading, caching, pagination, debouncing, memoization, and code splitting.
- Avoid unnecessary renders.

## TypeScript

- Always use strict TypeScript.
- Never use `any`. Use `unknown` and narrow with type guards.
- Prefer `type` over `interface` for object shapes unless extending.
- Use Zod for all runtime validation and infer types with `z.infer<typeof schema>`.
- Export feature-local types from a `types.ts` file within each feature folder.
- Use `satisfies` to validate objects against types without widening.
- Prefer named exports over default exports.
- Use `const` assertions where applicable.

### Naming

- Components: PascalCase, for example `ResearchCard`.
- Functions: camelCase, for example `generateProposal`.
- Constants: UPPER_SNAKE_CASE, for example `MAX_CHUNK_SIZE`.
- Database models: PascalCase, following Prisma conventions.
- Files: kebab-case, for example `research-card.tsx`.

### Error Handling

- Return typed Result objects: `{ success: true, data } | { success: false, error }`.
- Never throw in Server Actions. Return error states.
- Use try/catch only at infrastructure boundaries.
- Never expose internal error messages to clients.

## Project Structure

Preferred structure:

```txt
app/                          # Next.js App Router
  (auth)/                     # Auth route group
  (dashboard)/                # Dashboard route group
    student/
    supervisor/
    admin/
  api/                        # API routes for webhooks/callbacks/streaming/SSE
components/
  ui/                         # shadcn primitives
  shared/                     # Shared app components
  web/                        # Marketing/public website components
features/                     # Feature modules
  auth/
  projects/
  ai/
    chains/
    prompts/
    services/
  collaboration/
  evaluation/
  knowledge-base/
  analytics/
  notifications/
  repository/
lib/                          # Shared infrastructure
  auth.ts
  auth-client.ts
  prisma.ts
  redis.ts
  gemini.ts
  pinecone.ts
  socket-server.ts
  socket-client.ts
hooks/                        # Shared React hooks
types/                        # Global TypeScript types
proxy.ts                      # Route protection
prisma/
  schema.prisma
  migrations/
generated/prisma/             # Generated Prisma client; do not edit
public/                       # Static assets
```

Use imports like:

```ts
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
```

## Prisma and Database

- Schema: `prisma/schema.prisma`.
- Prisma config: `prisma.config.ts`, using `DATABASE_URL`.
- Generated client output: `generated/prisma/`; do not edit generated files.
- Keep a single Prisma client instance in `lib/prisma.ts`.
- Never instantiate `PrismaClient` outside `lib/prisma.ts`.
- Auth models `User`, `Session`, `Account`, and `Verification` are managed by Better Auth. Extend carefully.
- Use transactions for multi-step mutations with `db.$transaction(...)`.
- Paginate all list queries. Never return unbounded result sets.
- Use `select` to fetch only needed fields.
- Add indexes for foreign keys and frequently filtered columns.

After schema changes, run:

```bash
bunx prisma migrate dev
bunx prisma generate
```

### Repository Pattern

- Place DB access in `features/<feature>/repositories/`.
- Repositories are the only place Prisma is called.
- The application layer calls repositories, never Prisma directly.

### Schema Conventions

- All models use `id String @id @default(cuid())`.
- All models have `createdAt` and `updatedAt` timestamps.
- Use explicit relation field names.
- Use `deletedAt DateTime?` for soft delete where needed.
- Define enums in Prisma schema, not TypeScript.

### Multi-Tenant and RBAC Data Isolation

- Always scope queries to the authenticated user's department and role.
- Never return cross-department data without an admin role check.

## Auth

- Auth config lives in `lib/auth.ts`.
- Client helpers live in `lib/auth-client.ts`.
- Session type is extended with `role` and `departmentId`.
- Auth route handler lives in `app/api/auth/[...all]/route.ts` via `toNextJsHandler`.
- Server code imports `auth` from `@/lib/auth`.
- Client code imports from `@/lib/auth-client`.
- Never import server auth in Client Components.
- OAuth credentials come from environment variables such as `GOOGLE_*` and `GITHUB_*`.

### RBAC

- Roles are `student`, `supervisor`, and `admin`.
- Check role in every Server Action and API route.
- Use a shared helper such as `requireRole(session, "admin")`.
- Never trust client-side role claims. Always verify server-side.

### Route Protection

- Use `proxy.ts` to protect routes by role prefix:
  - `/student/*`: student only.
  - `/supervisor/*`: supervisor only.
  - `/admin/*`: admin only.
- Redirect unauthenticated users to `/login`.

### Session

- Session includes `userId`, `role`, `departmentId`, and `email`.
- Use short-lived access tokens and refresh token rotation.
- Use HTTP-only cookies only. Never store tokens in `localStorage`.

## Server Actions and API Routes

- Place actions in `features/<feature>/actions.ts` or `features/<feature>/actions/*.ts`.
- Put `"use server"` at the top of Server Action files.
- Validate all inputs with Zod before processing.
- Check session and RBAC at the start of every action.
- Return typed results: `{ success: true, data } | { success: false, error: string }`.
- Revalidate affected paths or tags after successful mutations.

Server Action template:

```ts
"use server"

import { z } from "zod"
import { getSession } from "@/lib/auth"

const schema = z.object({})

export async function myAction(input: unknown) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }

  try {
    const result = parsed.data
    return { success: true, data: result }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Something went wrong" }
  }
}
```

## UI and Components

- Shared shadcn primitives live in `components/ui/`.
- Shared composed app components live in `components/shared/`.
- Feature components live in `features/<feature>/components/`.
- Keep each component in its own kebab-case file.
- Prefer Server Components by default.
- Use shadcn/ui primitives instead of rebuilding primitives from scratch.
- Use `cn()` from `@/lib/utils` for conditional and merged classes.
- Use React Hook Form plus Zod for forms.
- Use skeletons for loading states, not spinners.
- Always handle empty states and error states explicitly.
- All interactive elements must be keyboard navigable.
- All images must have alt text.
- Use semantic HTML.
- Radix UI primitives handle ARIA by default. Do not override without reason.

### Tailwind and Design Tokens

- Use semantic tokens from `app/globals.css`.
- Do not hardcode colors like `bg-zinc-50`, `text-black`, or hex values in new UI.
- Available tokens include `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `card`, `popover`, `sidebar-*`, and `chart-*`.
- Dark mode uses the `.dark` class through `@custom-variant dark` in `globals.css`.
- Use `next/image` for static images in `public/`.
- Body typography uses `font-serif` via layout. Use `font-sans` or `font-mono` only intentionally.

### shadcn Patterns

- Add components with `bunx shadcn@latest add <component>`.
- New primitives go in `components/ui/`.
- Feature and section components go in `components/` or the relevant `features/<feature>/components/`.
- Follow `components/ui/button.tsx` patterns.
- Use `cva` for variants and export both the component and `*Variants`.
- Set `data-slot` on root elements.
- Support `asChild` via Radix `Slot.Root` when composition is needed.
- Extend shadcn components with `className`, not by duplicating variant logic.
- Import UI wrappers from `@/components/ui/*`.
- Do not add a legacy `tailwind.config.js`; this project uses Tailwind v4 CSS-first setup.
- Do not heavily edit generated shadcn files. Prefer composed wrappers.
- Do not use inline styles or arbitrary hex colors when a semantic token exists.
- Do not import Radix primitives directly in pages. Use `@/components/ui/*` wrappers.

## AI Services

### Gemini

- Initialize Gemini once in `lib/gemini.ts`.
- Use `gemini-1.5-pro` for generation and `text-embedding-004` for embeddings unless a task explicitly updates the model policy.
- Always set `temperature`, `topP`, and `maxOutputTokens` explicitly.
- Apply rate limiting on all Gemini calls.
- Cache repeated generation results in Redis with a 1 hour TTL.

### Pinecone

- Initialize Pinecone once in `lib/pinecone.ts`.
- Use index names like `research-{environment}`, for example `research-production`.
- Always include metadata with `userId`, `documentId`, `chunkIndex`, and `role`.
- Filter by `userId` or `departmentId` on every query. Never return cross-user vectors.
- Use chunk size 512 tokens and overlap 50 tokens.

### RAG Pipeline

Standard flow:

1. Extract text from the source file.
2. Chunk text with size 512 and overlap 50.
3. Embed chunks.
4. Upsert vectors to Pinecone with metadata.
5. Query Pinecone with top K of 5 and a user/department filter.
6. Build a prompt from system instructions, retrieved chunks, and the question.
7. Generate a response with Gemini.
8. Format citations back to source documents.

### LangChain and Async AI

- Use LangChain for complex chains, conditional flows, and tool use.
- Keep chain definitions in `features/ai/chains/`.
- Log chain inputs and outputs for debugging without leaking secrets.
- Long AI operations, such as proposal generation and literature review, run as background jobs.
- Use BullMQ and Redis for batch AI operations.
- Return a `jobId` immediately and poll for results.
- Stream responses where possible using Vercel AI SDK streaming.

## Real-Time

- Socket.io server lives in `lib/socket-server.ts`.
- Socket.io client lives in `lib/socket-client.ts`.
- Authenticate every socket connection with a session token.
- Join rooms scoped as `project:{id}`, `user:{id}`, and `department:{id}`.
- Client-to-server events use `client:action`, for example `client:send-message`.
- Server-to-client events use `server:event`, for example `server:new-message`.
- Error events use `server:error`.
- Validate all event payloads with Zod on the server.
- Check room membership before broadcasting.
- Rate limit events per socket connection.
- Never broadcast sensitive data. Notify clients and fetch sensitive data through authenticated APIs/actions.

## Feature Rules

### Analytics

Track:

- Student progress.
- Supervisor workload.
- Submission rates.
- Risk scoring.
- Research trends.

Visualize analytics with charts, dashboards, and KPIs.

### Notifications

Support:

- Deadline alerts.
- Feedback updates.
- Meeting reminders.
- Approval updates.
- Email notifications.
- In-app notifications.
- Real-time Socket.io notifications.

### Research Repository

Store:

- Past projects.
- Research papers.
- Capstone reports.

Support:

- Semantic search.
- Duplicate detection.
- Filtering by year, technology, and supervisor.
- AI recommendations.

## Documentation

- Do not add markdown or docs files unless the task asks for documentation or the feature scope requires it.
- For substantial new features, include a README or docs, architecture notes, usage examples, and required environment variables.

## Environment Variables

- Secrets live in `.env`.
- Never commit `.env*` files.
- Required variables include `DATABASE_URL` and OAuth client credentials.
- Access environment variables with `process.env.VAR_NAME` in server code only.
- Do not expose secrets in Client Components.
- Do not use `NEXT_PUBLIC_*` unless the variable is intentionally public.

## Commands

```bash
bun add <name>                   # Add a package
bun dev                          # Start dev server
bun run build                    # Production build
bun lint                         # ESLint
bunx prisma migrate dev          # Apply migrations
bunx prisma generate             # Generate Prisma client
bunx shadcn@latest add <name>    # Add shadcn component
```

Run `bun lint` after substantive changes.

## Git

Use these commit prefixes when asked to commit:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`

Commit rules:

- Make small commits.
- Include no secrets.
- Use meaningful messages.
- Keep one feature per commit.
- Do not create commits unless explicitly requested.

## Non-Negotiables

- TypeScript strict mode.
- Never use `any`.
- All inputs validated with Zod schemas.
- All database queries through Prisma ORM and feature repositories.
- All auth via Better Auth.
- Feature-based folder structure under `features/<feature-name>/`.
- RBAC enforced at route, server-action/API, and data-query levels.
