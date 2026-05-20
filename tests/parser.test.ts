import { describe, expect, it } from "vitest";
import { isReasonablePoint, parseFirstValidPoint, parsePointCandidates } from "@/lib/parser";

describe("parser", () => {
  it("parses point text candidates", () => {
    expect(parsePointCandidates("黄金买点 4550，止损 4520", { min: 3000, max: 6000 })).toEqual([4550, 4520]);
  });

  it("filters abnormal points", () => {
    expect(parsePointCandidates("0 -1 99 4550 99999", { min: 3000, max: 6000 })).toEqual([4550]);
    expect(isReasonablePoint(Number.NaN)).toBe(false);
  });

  it("returns first valid point or null", () => {
    expect(parseFirstValidPoint("白银 70.5 止损 68", { min: 10, max: 200 })).toBe(70.5);
    expect(parseFirstValidPoint("无有效点位", { min: 10, max: 200 })).toBeNull();
  });
});
