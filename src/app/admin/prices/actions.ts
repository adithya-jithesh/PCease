"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { refreshPrices } from "@/lib/prices/updater";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionResult {
  ok: boolean;
  message: string;
}

function revalidateCatalogue() {
  revalidatePath("/admin/prices");
  revalidatePath("/parts", "layout");
  revalidatePath("/");
}

const listingInput = z.object({
  part_id: z.coerce.number().int().positive(),
  retailer_id: z.coerce.number().int().positive(),
  price_inr: z.coerce.number().int().min(1).max(1_000_000),
  in_stock: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export async function updateListing(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = listingInput.safeParse({
    part_id: form.get("part_id"),
    retailer_id: form.get("retailer_id"),
    price_inr: form.get("price_inr"),
    in_stock: form.get("in_stock") ?? "false",
  });
  if (!parsed.success) return { ok: false, message: "Enter a whole-rupee price between ₹1 and ₹10,00,000." };

  const { error } = await createAdminClient()
    .from("listings")
    .update({
      price_inr: parsed.data.price_inr,
      in_stock: parsed.data.in_stock,
      source: "manual",
      updated_at: new Date().toISOString(),
    })
    .eq("part_id", parsed.data.part_id)
    .eq("retailer_id", parsed.data.retailer_id);
  if (error) return { ok: false, message: error.message };

  revalidateCatalogue();
  return { ok: true, message: "Saved" };
}

export async function refreshPart(slug: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const report = await refreshPrices({ trigger: "admin", slugs: [slug], budgetMs: 60_000 });
    revalidateCatalogue();
    const part = report.parts[0];
    if (part?.error) return { ok: false, message: part.error };
    return {
      ok: true,
      message: `${part?.updated.length ?? 0} price${part?.updated.length === 1 ? "" : "s"} updated, ${part?.rejected.length ?? 0} rejected.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Refresh failed" };
  }
}

export async function refreshStalest(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const report = await refreshPrices({ trigger: "admin", limit: 5, budgetMs: 100_000 });
    revalidateCatalogue();
    if (report.stopped) return { ok: false, message: report.stopped };
    return {
      ok: true,
      message: `Checked ${report.checked} parts: ${report.updated} prices updated, ${report.rejected} rejected.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Refresh failed" };
  }
}
