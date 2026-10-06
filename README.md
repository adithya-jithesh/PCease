# PCease

Plan a PC for the Indian market: compare part prices across Indian retailers, check compatibility as you build, and get advice from an AI that only recommends parts we actually list.

## Features

- **Parts catalogue**: search and filter CPUs, GPUs, motherboards, memory, storage, PSUs, cases and coolers. Every part page compares prices across retailers, highlights the cheapest, and charts the best price over time.
- **Builder**: pick parts slot by slot. Live checks cover sockets, memory generation, RAM slots, board/case fit, GPU length, cooler mounting and height, PSU headroom, display output, board tier and CPU/GPU balance. The part picker can hide anything incompatible with what you've already chosen.
- **Share links**: any build can be shared as a link, no account needed.
- **Compare**: put up to four parts side by side, with the better spec highlighted on each row.
- **AI advisor** (Gemini):
  - answers PC hardware questions only; a classifier turns away anything else before it reaches the main model
  - recommends parts through tools that search the catalogue, check compatibility and plan builds, so every suggestion is a real listing at today's price
  - mentioned parts become cards you can add to your build, and suggested builds load into the builder in one click
- **Budget planner**: tries every CPU and GPU pairing, completes each with compatible parts, and keeps the strongest build within budget.
- **Live prices**: a daily job uses Gemini with Google Search to refresh prices at our retailers, with safety checks and full price history. Admins can review runs and correct prices at `/admin/prices`.
- **Accounts** (Supabase Auth): save builds, make them public or private, duplicate them, and see how each build's price has moved since you saved it.
- **Forum**: threads by topic, replies, voting, and attaching a saved build to a post.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS v4 with a navy and teal design-token theme |
| Data & auth | Supabase (Postgres, row-level security, Supabase Auth) |
| AI | Google Gemini (`@google/genai`): function calling for the advisor, Google Search grounding for prices |
| Testing | Vitest |
| Hosting | Vercel (including Vercel Cron) + Supabase |

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Apply the schema and seed data.** In the SQL editor, run these in order:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_price_tracking.sql`
   3. `supabase/seed.sql` (safe to re-run; it never overwrites existing prices)
3. **Configure auth** (Supabase dashboard, Authentication):
   - URL configuration: set the Site URL and add `http://localhost:3000/auth/callback` (plus your production URL) to Redirect URLs.
   - Email confirmation needs a real email provider (Authentication → Emails → SMTP). Supabase's built-in sender is heavily rate limited, so turn **Confirm email** off for local development.
   - The Google button appears automatically once the Google provider is enabled.
4. **Set environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Publishable (anon) key |
   | `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL used for auth redirects |
   | `GEMINI_API_KEY` | for AI | AI advisor chat and price updates |
   | `SUPABASE_SECRET_KEY` | for prices | Server-only key that lets the price job and admin page write prices |
   | `CRON_SECRET` | for prices | Shared secret Vercel Cron sends to `/api/cron/prices` |
   | `ADMIN_EMAILS` | for prices | Comma-separated emails allowed into `/admin/prices` |

5. **Run it:**

   ```bash
   npm install
   npm run dev
   ```

## Keeping prices current

`/api/cron/prices` refreshes the parts whose prices were checked longest ago (up to 30 per run). `vercel.json` schedules it daily; set `CRON_SECRET` in Vercel and it authenticates automatically. For each part, Gemini searches Google for the price at each of our retailers, and a price is only written when:

- it comes from one of our retailers, and Google Search returned evidence from that retailer's domain;
- any product link is on that retailer's domain;
- it's within 60–150% of the part's current median price (bigger jumps are left for a human to confirm).

Every change, whether automatic, manual or from the seed, is recorded in `price_history`, which drives the charts on part pages. Rejected prices and their reasons are logged per run and visible at `/admin/prices`, where admins can also refresh a part on demand or fix a price by hand.

To refresh from your machine:

```bash
npm run prices:update                  # the 10 stalest parts
npm run prices:update -- --limit 61    # everything
npm run prices:update -- rtx-4060      # specific parts
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (compatibility, planner, advisor tools, price validation, share links) |
| `npm run prices:update` | Refresh prices from the command line |

## Project layout

```
src/
  app/              routes: parts, builder, compare, advisor, forum, dashboard, auth, admin
    api/advisor/    streaming, tool-calling AI advisor
    api/cron/       scheduled price refresh
  components/       shared UI (header, part cards, build sheet, checks, charts)
  lib/
    advisor/        advisor prompt, scope guard and tools
    prices/         price lookup, validation and updater
    compat.ts       compatibility and power analysis
    planner.ts      budget build planner
    data.ts         server-side catalogue queries
    stores.ts       localStorage-backed build and compare state
    supabase/       browser, server and admin clients
  proxy.ts          session refresh and protected routes
scripts/            command-line tools
supabase/
  migrations/       schema, triggers and RLS policies
  seed.sql          retailers and starter catalogue
```

## Notes

- Seed prices are indicative. Run the price job (or edit them in the admin page) before relying on them.
- Automatic prices are good but not perfect. Prices outside the safe range are skipped, so check the admin page now and then.
- The AI chat's rate limit is held in memory, per server instance. Use a shared store if you need exact limits across instances.
