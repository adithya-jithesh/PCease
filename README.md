# PCease

[![CI](https://github.com/adithya-jithesh/PCease/actions/workflows/ci.yml/badge.svg)](https://github.com/adithya-jithesh/PCease/actions/workflows/ci.yml)
[![Live site](https://img.shields.io/badge/live-pcease--virid.vercel.app-2dd4bf)](https://pcease-virid.vercel.app)

Plan a PC for the Indian market: compare part prices across Indian retailers, check compatibility as you build, and get advice from an AI that only recommends parts we actually list.

**Live site:** https://pcease-virid.vercel.app · **Repository:** https://github.com/adithya-jithesh/PCease

## Pages

| Page | Link | What it does |
| --- | --- | --- |
| Home | [/](https://pcease-virid.vercel.app) | Live sample build, categories, how it works |
| Parts | [/parts](https://pcease-virid.vercel.app/parts) | Search and filter the catalogue; each part page compares retailer prices and shows price history |
| Builder | [/builder](https://pcease-virid.vercel.app/builder) | Slot-by-slot builder with live compatibility and power checks |
| Compare | [/compare](https://pcease-virid.vercel.app/compare) | Up to four parts side by side |
| AI Advisor | [/advisor](https://pcease-virid.vercel.app/advisor) | Chat with the AI advisor, or use the [budget planner](https://pcease-virid.vercel.app/advisor?tab=planner) |
| Forum | [/forum](https://pcease-virid.vercel.app/forum) | Threads, replies, voting and attached builds |
| Sign in | [/login](https://pcease-virid.vercel.app/login) | Email sign-in (Google appears once enabled in Supabase) |
| Dashboard | [/dashboard](https://pcease-virid.vercel.app/dashboard) | Your saved builds and threads (signed in) |
| Price admin | [/admin/prices](https://pcease-virid.vercel.app/admin/prices) | Review price runs and edit prices (admins only) |

## Features

- **Parts catalogue**: search and filter CPUs, GPUs, motherboards, memory, storage, PSUs, cases and coolers. Every part page compares prices across retailers, highlights the cheapest, and charts the best price over time.
- **Builder**: pick parts slot by slot. Live checks cover sockets, memory generation, RAM slots, board/case fit, GPU length, cooler mounting and height, PSU headroom, display output, board tier and CPU/GPU balance. The part picker can hide anything incompatible with what you've already chosen.
- **Share links**: any build can be shared as a link, no account needed.
- **Compare**: put up to four parts side by side, with the better spec highlighted on each row.
- **AI advisor** (Gemini):
  - answers PC hardware questions only; a classifier turns away anything else (including attempts to override its instructions) before it reaches the main model
  - recommends parts through tools that search the catalogue, check compatibility and plan builds, so every suggestion is a real listing at today's price
  - mentioned parts become cards you can add to your build, and suggested builds load into the builder in one click
  - falls back across several Gemini models when one is busy, and retries replies that get cut off
- **Budget planner**: tries every CPU and GPU pairing, completes each with compatible parts, and keeps the strongest build within budget.
- **Live prices**: a daily job uses Gemini with Google Search to refresh prices at our retailers, with safety checks and full price history. Admins can review runs and correct prices by hand.
- **Accounts** (Supabase Auth): save builds, make them public or private, duplicate them, and see how each build's price has moved since you saved it.
- **Forum**: threads by topic, replies, voting, and attaching a saved build to a post.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | [Next.js 16](https://nextjs.org/docs) (App Router, Server Components, Server Actions), [React 19](https://react.dev), TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/docs) with a navy and teal design-token theme |
| Data & auth | [Supabase](https://supabase.com/docs) (Postgres, row-level security, Supabase Auth) |
| AI | [Google Gemini API](https://ai.google.dev/gemini-api/docs) via [`@google/genai`](https://www.npmjs.com/package/@google/genai): function calling for the advisor, [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search) for prices |
| Testing | [Vitest](https://vitest.dev) |
| Hosting | [Vercel](https://vercel.com/docs) (including [Vercel Cron](https://vercel.com/docs/cron-jobs)) + Supabase |
| CI | [GitHub Actions](https://github.com/adithya-jithesh/PCease/actions): lint, typecheck, tests and build on every push |

## Getting started

1. **Create a Supabase project** in the [Supabase dashboard](https://supabase.com/dashboard).
2. **Apply the schema and seed data.** Open the project's **SQL Editor** and run these files in order:
   1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   2. [`supabase/migrations/0002_price_tracking.sql`](supabase/migrations/0002_price_tracking.sql)
   3. [`supabase/seed.sql`](supabase/seed.sql) (safe to re-run; it never overwrites existing prices)
3. **Configure auth** (dashboard → Authentication):
   - **URL Configuration:** set the Site URL and add `http://localhost:3000/auth/callback` plus `https://<your-domain>/auth/callback` to Redirect URLs ([docs](https://supabase.com/docs/guides/auth/redirect-urls)).
   - **Email:** Supabase's built-in email sender is heavily rate limited. Either turn **Confirm email** off (Sign In / Providers → Email) or connect a real provider under Emails → SMTP ([docs](https://supabase.com/docs/guides/auth/auth-smtp)); [Resend](https://resend.com) has a free tier.
   - **Google sign-in (optional):** enable the Google provider with OAuth credentials from the [Google Cloud console](https://console.cloud.google.com/apis/credentials) ([guide](https://supabase.com/docs/guides/auth/social-login/auth-google)). The button appears on the sign-in page automatically.
4. **Set environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Where to get it |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Project Settings → API ([docs](https://supabase.com/docs/guides/api/api-keys)) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase → Project Settings → API Keys → publishable key |
   | `NEXT_PUBLIC_SITE_URL` | recommended | Your site's URL, e.g. `http://localhost:3000` locally |
   | `GEMINI_API_KEY` | for AI | [Google AI Studio → API keys](https://aistudio.google.com/apikey) |
   | `SUPABASE_SECRET_KEY` | for prices | Supabase → Project Settings → API Keys → secret key. **Server only; never share it.** |
   | `CRON_SECRET` | for prices | Any long random string, e.g. `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |
   | `ADMIN_EMAILS` | for prices | Comma-separated emails allowed into `/admin/prices` |

5. **Run it:**

   ```bash
   npm install
   npm run dev
   ```

   Then open http://localhost:3000.

## AI models

The advisor, its topic check and the price lookups each try a list of Gemini models in order, moving to the next when one is overloaded (503) or out of quota (429), and skipping a busy model for a minute. Defaults live in [`src/lib/ai.ts`](src/lib/ai.ts). Google retires and renames models regularly ([current models](https://ai.google.dev/gemini-api/docs/models)), so you can override the lists without a code change:

| Variable | Used for | Needs |
| --- | --- | --- |
| `GEMINI_CHAT_MODELS` | AI advisor | function calling |
| `GEMINI_FAST_MODELS` | off-topic check | JSON output |
| `GEMINI_PRICE_MODELS` | price updates | Google Search grounding |

Each takes a comma-separated list, best first, e.g. `GEMINI_CHAT_MODELS=gemini-3.8-flash,gemini-3.5-flash-lite`.

## Keeping prices current

`/api/cron/prices` refreshes the parts whose prices were checked longest ago (up to 30 per run). [`vercel.json`](vercel.json) schedules it daily, and Vercel authenticates it with `CRON_SECRET`. For each part, Gemini searches Google for the price at each of our retailers, and a price is only written when:

- it comes from one of our retailers, and Google Search returned evidence from that retailer's domain;
- any product link is on that retailer's domain;
- it's within 60–150% of the part's current median price (bigger jumps are left for a human to confirm).

Every change, whether automatic, manual or from the seed, is recorded in `price_history`, which drives the charts on part pages. Rejected prices and their reasons are logged per run and shown on `/admin/prices`, where admins can also refresh a part on demand or fix a price by hand.

> **Billing required for automatic prices.** Free Gemini API keys get little or no Google Search grounding quota, so lookups fail with "quota exceeded" until billing is enabled on the key's Google Cloud project ([billing](https://ai.google.dev/gemini-api/docs/billing), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)). The job detects this, stops early with a clear message and changes nothing. The AI advisor itself works on the free tier.

To refresh from your machine (reads `.env.local`):

```bash
npm run prices:update                  # the 10 stalest parts
npm run prices:update -- --limit 61    # everything
npm run prices:update -- rtx-4060      # specific parts
```

## Deploying to Vercel

1. Import the repository in [Vercel](https://vercel.com/new) (framework preset: Next.js, root directory: the repo root, Node.js 22 or 24).
2. Add every variable from the table above under **Settings → Environment Variables** ([docs](https://vercel.com/docs/environment-variables)), with `NEXT_PUBLIC_SITE_URL` set to your production URL.
3. Add `https://<your-domain>/auth/callback` to Supabase's Redirect URLs.
4. Push to `main`. Vercel deploys automatically, and the daily price job is registered from `vercel.json`.

From the command line with the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npx vercel link
npx vercel env add GEMINI_API_KEY production
npx vercel deploy --prod
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (compatibility, planner, advisor tools, model fallback, price validation, share links) |
| `npm run prices:update` | Refresh prices from the command line |

## Project layout

```
src/
  app/              routes: parts, builder, compare, advisor, forum, dashboard, auth, admin
    api/advisor/    streaming, tool-calling AI advisor
    api/cron/       scheduled price refresh
  components/       shared UI (header, part cards, build sheet, checks, charts, toasts)
  lib/
    ai.ts           Gemini client, model lists and fallback
    advisor/        advisor prompt, scope guard, tools and slug handling
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

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Sign-up says "email rate limit exceeded" or no confirmation email arrives | Supabase's built-in sender is limited to a few emails an hour. Turn off **Confirm email** or set up SMTP (see Getting started). |
| "Continue with Google" gives a 400 "provider is not enabled" | Enable the Google provider in Supabase. The button is hidden automatically until you do. |
| AI advisor says it isn't switched on | Set `GEMINI_API_KEY` and restart the server (or redeploy on Vercel). |
| AI errors mention a model "no longer available" (404) | Google retired the model. Set `GEMINI_CHAT_MODELS` / `GEMINI_FAST_MODELS` / `GEMINI_PRICE_MODELS` to [current models](https://ai.google.dev/gemini-api/docs/models). |
| "The AI is very busy right now" | Every configured model is overloaded (503). It usually clears within minutes; adding another model to the list helps. |
| Price updates stop with "Google Search quota is exhausted" | Enable billing on the Gemini key's project (see Keeping prices current). |
| CI fails at `npm ci` with "Missing: @emnapi/... from lock file" | Run `npm install` on any OS and commit `package-lock.json`. The `@emnapi` packages are pinned in `devDependencies` to keep Windows installs from dropping them. |

## Notes

- Seed prices are indicative. Run the price job, or edit prices on the admin page, before relying on them.
- Automatic prices are good but not perfect. Prices outside the safe range are skipped, so check the admin page now and then.
- The AI chat's rate limit and model cooldowns are held in memory per server instance. Use a shared store such as [Upstash Redis](https://upstash.com) if you need exact limits across instances.
