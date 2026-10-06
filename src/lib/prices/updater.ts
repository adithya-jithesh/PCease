import { createGemini, isQuotaError } from "../ai";
import { createAdminClient } from "../supabase/admin";
import { lookupPrices } from "./lookup";
import { judgeOffer, median, type RetailerRef } from "./validate";

export interface RefreshOptions {
  /** Refresh these parts; otherwise the `limit` parts checked longest ago. */
  slugs?: string[];
  limit?: number;
  /** Stop starting new lookups after this many ms (serverless time limits). */
  budgetMs?: number;
  /** Pause between lookups to stay under Gemini rate limits. */
  delayMs?: number;
  trigger: "cron" | "admin" | "cli";
  log?: (line: string) => void;
}

export interface PartReport {
  slug: string;
  updated: { store: string; from: number | null; to: number }[];
  rejected: { store: string; reason: string }[];
  error?: string;
}

export interface RefreshReport {
  checked: number;
  updated: number;
  rejected: number;
  parts: PartReport[];
  /** Set when the run stopped early, e.g. because Gemini is out of quota. */
  stopped?: string;
}

export const GROUNDING_QUOTA_MESSAGE =
  "Gemini's Google Search quota is exhausted for this API key. Free keys get little or no search " +
  "grounding: enable billing on the key's Google Cloud project (https://aistudio.google.com/apikey → " +
  "Set up billing) or wait for the quota to reset.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function refreshPrices(options: RefreshOptions): Promise<RefreshReport> {
  const { limit = 10, budgetMs = 240_000, delayMs = 4_000, trigger, log = () => {} } = options;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Price updates need GEMINI_API_KEY in the server environment.");

  const started = Date.now();
  const db = createAdminClient();
  const ai = createGemini(apiKey, 90_000);

  const { data: retailers, error: rErr } = await db.from("retailers").select("id, slug, name, homepage");
  if (rErr || !retailers) throw new Error(`Couldn't load retailers: ${rErr?.message}`);

  let query = db.from("parts").select("id, slug, brand, name, category, specs");
  query = options.slugs?.length
    ? query.in("slug", options.slugs)
    : query.order("prices_checked_at", { ascending: true, nullsFirst: true }).limit(limit);
  const { data: parts, error: pErr } = await query;
  if (pErr || !parts) throw new Error(`Couldn't load parts: ${pErr?.message}`);

  const { data: run } = await db.from("price_runs").insert({ trigger }).select("id").single();
  const report: RefreshReport = { checked: 0, updated: 0, rejected: 0, parts: [] };
  let quotaFailuresInARow = 0;

  for (const [index, part] of parts.entries()) {
    if (Date.now() - started > budgetMs) {
      log(`Time budget reached after ${report.checked} parts.`);
      break;
    }
    if (index > 0) await sleep(delayMs);

    const partReport: PartReport = { slug: part.slug, updated: [], rejected: [] };
    report.parts.push(partReport);
    report.checked++;

    try {
      const { data: listings } = await db
        .from("listings")
        .select("retailer_id, price_inr")
        .eq("part_id", part.id);
      const current = new Map((listings ?? []).map((l) => [l.retailer_id as number, l.price_inr as number]));
      const reference = median([...current.values()]);

      const { offers, evidenceHosts } = await lookupPrices(ai, part, retailers as (RetailerRef & { name: string })[]);

      for (const offer of offers) {
        const verdict = judgeOffer(offer, retailers as RetailerRef[], evidenceHosts, reference);
        if (!verdict.ok) {
          partReport.rejected.push({ store: offer.store, reason: verdict.reason });
          continue;
        }
        const { error } = await db.from("listings").upsert(
          {
            part_id: part.id,
            retailer_id: verdict.retailer.id,
            price_inr: verdict.price,
            in_stock: verdict.inStock,
            url: verdict.url,
            source: "ai",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "part_id,retailer_id" },
        );
        if (error) {
          partReport.rejected.push({ store: offer.store, reason: `write failed: ${error.message}` });
          continue;
        }
        partReport.updated.push({
          store: verdict.retailer.slug,
          from: current.get(verdict.retailer.id) ?? null,
          to: verdict.price,
        });
      }
      quotaFailuresInARow = 0;
    } catch (err) {
      partReport.error = err instanceof Error ? err.message : String(err);
      if (isQuotaError(err)) {
        partReport.error = GROUNDING_QUOTA_MESSAGE;
        quotaFailuresInARow++;
      }
    }

    // Out of quota on every model: further lookups would fail the same way.
    if (quotaFailuresInARow >= 2) {
      report.stopped = GROUNDING_QUOTA_MESSAGE;
      report.updated += partReport.updated.length;
      log(`Stopping: ${GROUNDING_QUOTA_MESSAGE}`);
      break;
    }

    // Mark as checked even when nothing was found, so the rotation moves on.
    await db.from("parts").update({ prices_checked_at: new Date().toISOString() }).eq("id", part.id);

    report.updated += partReport.updated.length;
    report.rejected += partReport.rejected.length;
    log(
      `${part.slug}: ${partReport.updated.length} updated, ${partReport.rejected.length} rejected` +
        (partReport.error ? ` (error: ${partReport.error})` : ""),
    );
  }

  if (run) {
    await db
      .from("price_runs")
      .update({
        finished_at: new Date().toISOString(),
        checked: report.checked,
        updated: report.updated,
        rejected: report.rejected,
        details: report.stopped ? [...report.parts, { stopped: report.stopped }] : report.parts,
      })
      .eq("id", run.id);
  }

  return report;
}
