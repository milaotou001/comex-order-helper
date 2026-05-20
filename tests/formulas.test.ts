import { describe, expect, it } from "vitest";
import {
  calculateBargainPrice,
  calculateEasyPrice,
  calculateLeveragedEtfPrice,
  calculatePlainEtfPrice,
  getRiskLevel
} from "@/lib/formulas";

describe("formulas", () => {
  it("converts COMEX point to plain ETF price", () => {
    expect(calculatePlainEtfPrice(85, 4550, 4500)).toBeCloseTo(85.9444, 4);
  });

  it("converts COMEX point to leveraged ETF reference price", () => {
    expect(calculateLeveragedEtfPrice(56, 4550, 4500)).toBeCloseTo(57.2444, 4);
  });

  it("calculates easy fill price", () => {
    expect(calculateEasyPrice(85.65, 0.1)).toBeCloseTo(85.73565, 5);
  });

  it("calculates bargain price", () => {
    expect(calculateBargainPrice(85.65, 0.3)).toBeCloseTo(85.39305, 5);
  });

  it("marks leveraged reference risk by distance", () => {
    expect(getRiskLevel(4.99)).toBe("normal");
    expect(getRiskLevel(5.01)).toBe("warning");
    expect(getRiskLevel(-8.01)).toBe("danger");
  });
});
