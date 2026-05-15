import { describe, it, expect } from "vitest";
import { HeuristicPredictor } from "@/lib/predictor";

describe("HeuristicPredictor.estimateMinutes", () => {
  const predictor = new HeuristicPredictor({ defaultConsultationMinutes: 15 });

  it("returns 0 when no one is ahead", () => {
    expect(predictor.estimateMinutes({ positionAhead: 0 })).toBe(0);
  });

  it("multiplies position by default consultation minutes", () => {
    expect(predictor.estimateMinutes({ positionAhead: 4 })).toBe(60);
  });

  it("uses rolling average when 5+ historical samples are provided", () => {
    const p = new HeuristicPredictor({ defaultConsultationMinutes: 15 });
    expect(
      p.estimateMinutes({ positionAhead: 3, recentConsultationMinutes: [10, 20, 30, 20, 20] })
    ).toBe(60);
  });

  it("falls back to default when fewer than 5 samples are provided", () => {
    const p = new HeuristicPredictor({ defaultConsultationMinutes: 15 });
    expect(
      p.estimateMinutes({ positionAhead: 2, recentConsultationMinutes: [9, 9, 9, 9] })
    ).toBe(30);
  });
});
