# Agents

Act as a Principal Software Architect, Senior AI Engineer, Senior Full-Stack Engineer, UI/UX Designer, and Database Architect.

Design and build a production-ready researcher platform for final year university students.

The platform must support the complete research lifecycle from idea generation, proposal writing, literature review, implementation, supervision, collaboration, evaluation, and final defense.

The application should be comparable to Notion AI, ChatPDF, Elicit, Research Rabbit, Google Scholar, Mendeley, Overleaf, and GitHub Projects, but specifically designed for universities.

The application should be scalable, modular, AI-powered, secure, responsive, cloud-native, and capable of supporting thousands of students, supervisors, and departments.

## GENERAL REQUIREMENTS

### Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Package manager**: Bun (`bun dev`, `bunx …`)
- **Database**: PostgreSQL via **Prisma 7** + `@prisma/adapter-pg`
- **Auth**: **Better Auth** with Prisma adapter
- **UI**: shadcn/ui — see `ui-shadcn-tailwind` rule for component/styling details

### Architecture

**Pattern:** Clean Architecture with Feature-Based Modular Design

**Layers (top → bottom)**:

- **Presentation**   : Next.js App Router, React, Shadcn UI
- **Application**    : Server Actions, Business Logic, Use Cases
- **Domain**         : Entities, Value Objects, Domain Services
- **Infrastructure** : PostgreSQL, Prisma, Redis, Pinecone, Gemini API, uploadthing

Critical rule: Dependencies ONLY point inward. Domain layer has ZERO external imports.

## User Roles

- **student**    : Manage your projects, submit milestones, collaborate with peers, and access AI tools to strengthen your research.
- **supervisor** : Oversee assigned students, provide structured feedback, and monitor progress across all your supervisees.
- **admin**      : full access + Manage users, configure institutional settings, and access platform-wide analytics and reporting.

Always enforce RBAC at: route level, API level, and data query level.

## Next.js

This is NOT standard Next.js from training data. Before writing or changing framework code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

- Use the App Router under `app/`
- Prefer Server Components; add `"use client"` only for hooks, events, or browser APIs
- API routes live in `app/api/`
- Static assets go in `public/`

### Routing

- Use App Router only (`app/`). Never use Pages Router.
- Colocate route-specific components in the route folder
- Use route groups `(group)` to organize without affecting URL
- Use parallel routes `@slot` for dashboard layouts
- Use intercepting routes for modals
- Import with the `@/*` alias (maps to project root)

### Components

- Default to Server Components. Add `"use client"` only when needed:
  - Interactive UI (onClick, onChange, etc.)
  - Browser-only APIs
  - React hooks
- Never fetch data in Client Components — pass as props from Server Components

### Data Fetching

- Use Server Actions for mutations (not API routes)
- Use `cache()` and `unstable_cache()` for memoization
- Add `revalidatePath()` or `revalidateTag()` after mutations
- Use `loading.tsx` for Suspense boundaries
- Use `error.tsx` for error boundaries

### Performance

- Use `next/image` for all images
- Use `next/font` for all fonts
- Dynamic import heavy components: `const X = dynamic(() => import(...))`
- Add `export const dynamic = 'force-static'` where possible

### File Conventions

- `page.tsx`       → Route page (Server Component)
- `layout.tsx`     → Shared layout
- `loading.tsx`    → Suspense fallback
- `error.tsx`      → Error boundary
- `not-found.tsx`  → 404 page
- `route.ts`       → API route handler

## TypeScript Standards

- Always use TypeScript strict mode
- Never use `any` — use `unknown` and narrow with type guards
- Prefer `type` over `interface` for object shapes unless extending
- Use Zod for all runtime validation and infer types with `z.infer<typeof schema>`
- Export types from a `types.ts` file within each feature folder
- Use `satisfies` operator to validate objects against types without widening
- Prefer named exports over default exports
- Use `const` assertions where applicable

### Naming Conventions

- Components:  PascalCase  (e.g. `ResearchCard`)
- Functions:   camelCase   (e.g. `generateProposal`)
- Constants:   UPPER_SNAKE (e.g. `MAX_CHUNK_SIZE`)
- DB models:   PascalCase  (Prisma convention)
- Files:       kebab-case  (e.g. `research-card.tsx`)

### Error Handling

- Always return typed Result objects: `{ success: true, data } | { success: false, error }`
- Never throw in Server Actions — return error states
- Use try/catch only at infrastructure boundaries

## Project layout

app/              Pages, layouts, API routes
components/       React components (ui/ = shadcn primitives)
lib/              Shared server/client utilities
prisma/           Schema + migrations
generated/prisma/ Generated Prisma client — do not edit
public/           Static files (images, etc.)

Import with the `@/*` alias (maps to project root):

```ts
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
```

### Folder Structure

you can update this folder structure
app/                          # Next.js App Router
├── (auth)/                   # Auth route group
├── (dashboard)/              # Dashboard route group
│   ├── student/
│   ├── supervisor/
│   └── admin/
└── api/                      # API routes (webhooks only)
components/
├── ui/                       # Shadcn components
├── shared/                   # Shared app components
└── web/                      # website main components
features/                     # Feature modules
├── auth/
├── projects/
├── ai/
│   ├── chains/
│   ├── prompts/
│   └── services/
├── collaboration/
├── evaluation/
└── knowledge-base/
lib/                          # Shared infrastructure
├── auth.ts
├── prisma.ts
├── redis.ts
├── gemini.ts
├── pinecone.ts
└── socket-server.ts
hooks/                        # Shared React hooks
types/                        # Global TypeScript types
proxy.ts                   # Route protection
prisma/
├── schema.prisma
└── migrations/
.cursor/
└── rules/
    ├── project-conventions.mdc
    ├── typescript.mdc
    ├── nextjs.mdc
    ├── server-actions.mdc
    ├── database.mdc
    ├── auth.mdc
    ├── ai.mdc
    ├── components.mdc
    ├── realtime.mdc
    └── structure.mdc

## Prisma

- Schema: `prisma/schema.prisma` — client output is `../generated/prisma`
- Config: `prisma.config.ts` (uses `DATABASE_URL` from env)
- Keep a single Prisma client instance: `lib/prisma.ts`
- Singleton client: `lib/prisma.ts` - Never instantiate PrismaClient directly outside of `lib/prisma.ts` - import this everywhere; do not instantiate `PrismaClient` elsewhere
- Auth models (`User`, `Session`, `Account`, `Verification`) are managed by Better Auth — extend carefully
- Use transactions for multi-step mutations: `db.$transaction([])`
- Paginate all list queries — never return unbounded results
- Use `select` to fetch only needed fields
- Always add indexes for foreign keys and frequently filtered columns

After schema changes:

```bash
bunx prisma migrate dev
bunx prisma generate
```

Do not commit or hand-edit files in `generated/prisma/` (gitignored).

### Repository Pattern

- Place DB access in `features/<feature>/repositories/`
- Repositories are the ONLY place Prisma is called
- Application layer calls repositories, never Prisma directly

### Schema Conventions

- All models use `id String @id @default(cuid())`
- All models have `createdAt` and `updatedAt` timestamps
- Use explicit relation field names
- Soft delete with `deletedAt DateTime?` where needed
- All enums defined in Prisma schema, not TypeScript

### Multi-tenant / RBAC Data Isolation

- Always scope queries to the authenticated user's department/role
- Never return cross-department data without admin role check

## Auth (Better Auth)

- Auth config lives in `lib/auth.ts`
- Client helpers in `lib/auth-client.ts`
- Session type extended with `role` and `departmentId`

| File | Purpose |
| --- | --- |
| `lib/auth.ts` | Server-side `auth` instance (Prisma adapter, email/password, Google, GitHub) |
| `lib/auth-client.ts` | Client hooks: `signIn`, `signUp`, `signOut`, `useSession` |
| `app\api\auth\[...all]\route.ts` | Auth API handler via `toNextJsHandler` |

- Server: import `auth` from `@/lib/auth`
- Client: import from `@/lib/auth-client` — never import server auth in client components
- OAuth credentials come from env (`GOOGLE_*`, `GITHUB_*`)

### RBAC Enforcement

- Define roles: `student | supervisor | admin`
- Check role in EVERY server action and API route
- Use a shared helper: `requireRole(session, "admin")`
- Never trust client-side role claims — always verify server-side

### Route Protection

- Use `proxy.ts` to protect routes by role prefix:
  - `/student/*`    → student only
  - `/supervisor/*` → supervisor only
  - `/admin/*`      → admin only
- Redirect unauthenticated users to `/login`

### Session

- Session includes: `userId`, `role`, `departmentId`, `email`
- Short-lived access tokens + refresh token rotation
- HTTP-only cookies only — never store tokens in localStorage

## Environment variables

- Secrets live in `.env` — never commit `.env*` files
- Required vars include `DATABASE_URL` and OAuth client credentials
- Access via `process.env.VAR_NAME` in server code only
- Do not expose secrets in client components or `NEXT_PUBLIC_*` unless intentionally public

## Code standards

- Keep changes minimal and scoped to the task
- Match existing patterns before introducing new abstractions
- Run `bun lint` after substantive changes
- Do not add markdown/docs files unless asked
- Do not create commits unless explicitly requested

## Commands

```bash
bun add <name>                   # Add New package
bun dev                          # Dev server
bun run build                    # Production build
bun lint                         # ESLint
bunx prisma migrate dev          # Apply migrations
bunx shadcn@latest add <name>    # Add UI component
```

## Non-negotiables

- TypeScript strict mode. Never use `any`.
- All inputs validated with Zod schemas
- All DB queries through Prisma ORM
- All auth via Better Auth
- Feature-based folder structure: `features/<feature-name>/`
