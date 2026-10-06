import { refreshPrices } from "@/lib/prices/updater";

// Each lookup takes a few seconds; allow a long run on Vercel.
export const maxDuration = 300;

/**
 * Scheduled price refresh. Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`; anything else is rejected.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await refreshPrices({ trigger: "cron", limit: 30, budgetMs: 270_000 });
    return Response.json({ checked: report.checked, updated: report.updated, rejected: report.rejected });
  } catch (err) {
    console.error("price refresh failed", err);
    return Response.json({ error: err instanceof Error ? err.message : "Price refresh failed" }, { status: 500 });
  }
}
