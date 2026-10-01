# PCease

Plan a PC for the Indian market: compare part prices across Indian retailers, check compatibility as you build, and get budget-aware recommendations.

## Features

- **Parts catalogue**: search and filter CPUs, GPUs, motherboards, memory, storage, PSUs, cases and coolers. Every part page compares prices across retailers and highlights the cheapest.
- **Builder**: pick parts slot by slot. Live checks cover sockets, memory generation, RAM slots, board/case fit, GPU length, cooler mounting and height, PSU headroom, display output and CPU/GPU balance. The part picker can hide anything incompatible with what you've already chosen.
- **Share links**: any build can be shared as a link, no account needed.
- **Compare**: put up to four parts side by side, with the better spec highlighted on each row.
- **Advisor**:
  - a budget planner that tries every CPU and GPU pairing, completes each with compatible parts, and keeps the strongest build within budget
  - a Gemini-powered chat that knows the catalogue and current prices
- **Accounts** (Supabase Auth, email or Google): save builds, make them public or private, duplicate them, and see how each build's price has moved since you saved it.
- **Forum**: threads by topic, replies, voting, and attaching a saved build to a post.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS v4 with a navy and teal design-token theme |
| Data & auth | Supabase (Postgres, row-level security, Supabase Auth) |
| AI | Google Gemini (`@google/genai`), streamed from a route handler |
| Testing | Vitest |
| Hosting | Vercel + Supabase |

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Apply the schema and seed data.** In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`. With the Supabase CLI you can run `supabase db push` instead, then run the seed.
3. **Configure auth** (Supabase dashboard, Authentication):
   - URL configuration: set the Site URL and add `http://localhost:3000/auth/callback` (plus your production URL) to Redirect URLs.
   - Providers: Email is on by default. To enable Google, add your Google OAuth client ID and secret.
4. **Set environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Publishable (anon) key |
   | `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL used for auth redirects |
   | `GEMINI_API_KEY` | optional | Turns on the AI chat; the budget planner works without it |

5. **Run it:**

   ```bash
   npm install
   npm run dev
   ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (compatibility engine, planner, share links) |

## Project layout

```
src/
  app/            routes: parts, builder, compare, advisor, forum, dashboard, auth
  components/     shared UI (header, part cards, build sheet, checks)
  lib/
    compat.ts     compatibility and power analysis
    planner.ts    budget build planner
    data.ts       server-side catalogue queries
    stores.ts     localStorage-backed build and compare state
    supabase/     browser and server clients
  proxy.ts        session refresh and protected routes
supabase/
  migrations/     schema, triggers and RLS policies
  seed.sql        retailers and starter catalogue
```

## Notes

- Seed prices are indicative street prices. Refresh the `listings` table before relying on them.
- The AI chat's rate limit is held in memory, per server instance. Use a shared store if you need exact limits across instances.

## Acknowledgements

PCease started as a project with [Vaibhav Shiroorkar](https://github.com/vaibhavshiroorkar/pcease). This version is a ground-up rewrite with a new stack, design and data model.
