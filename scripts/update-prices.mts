/**
 * Refresh catalogue prices from the command line.
 *
 *   npm run prices:update                 # the 10 parts checked longest ago
 *   npm run prices:update -- --limit 61   # more parts
 *   npm run prices:update -- rtx-4060 ryzen-5-7600
 *
 * Reads GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
 */
import { refreshPrices } from "../src/lib/prices/updater";

const args = process.argv.slice(2);
const limitFlag = args.indexOf("--limit");
const limit = limitFlag >= 0 ? Number(args[limitFlag + 1]) : 10;
const slugs = args.filter((a, i) => !a.startsWith("--") && (limitFlag < 0 || i !== limitFlag + 1));

let report;
try {
  report = await refreshPrices({
    trigger: "cli",
    limit,
    slugs: slugs.length ? slugs : undefined,
    budgetMs: Number.POSITIVE_INFINITY,
    log: (line) => console.log(line),
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

console.log(`\nChecked ${report.checked} parts: ${report.updated} prices updated, ${report.rejected} rejected.`);
for (const part of report.parts) {
  for (const u of part.updated) console.log(`  ✓ ${part.slug} @ ${u.store}: ${u.from ?? "new"} → ${u.to}`);
  for (const r of part.rejected) console.log(`  ✗ ${part.slug} @ ${r.store}: ${r.reason}`);
}
