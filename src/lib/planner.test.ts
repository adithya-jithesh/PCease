import { describe, expect, it } from "vitest";
import { loadSeedCatalogue } from "./__fixtures__/catalogue";
import { analyzeBuild } from "./compat";
import { planBuild, USE_CASES, type UseCase } from "./planner";

const parts = loadSeedCatalogue();
const budgets = [45000, 60000, 80000, 120000, 200000, 300000];

describe("planBuild", () => {
  for (const useCase of Object.keys(USE_CASES) as UseCase[]) {
    for (const budget of budgets) {
      it(`${useCase} at ₹${budget} is complete, compatible and within budget`, () => {
        const plan = planBuild(parts, budget, useCase);
        expect(plan).not.toBeNull();
        expect(plan!.total).toBeLessThanOrEqual(budget);

        const analysis = analyzeBuild(plan!.build);
        expect(analysis.checks.filter((c) => c.level === "error")).toEqual([]);
        expect(analysis.missing).toEqual([]);
      });
    }
  }

  it("returns null when nothing fits", () => {
    expect(planBuild(parts, 10000, "gaming")).toBeNull();
  });

  it("spends more of a bigger budget on graphics for gaming", () => {
    const small = planBuild(parts, 60000, "gaming")!;
    const large = planBuild(parts, 200000, "gaming")!;
    expect(large.build.gpu!.tier!).toBeGreaterThan(small.build.gpu!.tier!);
  });

  it("keeps a proper platform when the budget allows it", () => {
    const plan = planBuild(parts, 80000, "gaming")!;
    expect(plan.build.cooler).toBeDefined();
    expect(Number(plan.build.storage!.specs.capacity_gb)).toBeGreaterThanOrEqual(1000);
    expect(Number(plan.build.ram!.specs.capacity_gb)).toBeGreaterThanOrEqual(16);
  });

  it("can skip the graphics card for office builds", () => {
    const plan = planBuild(parts, 45000, "office")!;
    expect(plan.build.gpu).toBeUndefined();
    expect(plan.build.cpu!.specs.igpu).toBe(true);
  });
});
