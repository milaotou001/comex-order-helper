export type PointRange = {
  min?: number;
  max?: number;
};

const NUMBER_PATTERN = /(?:^|[^\d.-])(\d+(?:\.\d+)?)(?![\d.])/g;

export function parsePointCandidates(text: string, range: PointRange = {}): number[] {
  const points: number[] = [];

  for (const match of text.matchAll(NUMBER_PATTERN)) {
    const value = Number(match[1]);
    if (isReasonablePoint(value, range)) {
      points.push(value);
    }
  }

  return points;
}

export function parseFirstValidPoint(text: string, range: PointRange = {}): number | null {
  return parsePointCandidates(text, range)[0] ?? null;
}

export function isReasonablePoint(value: number, range: PointRange = {}): boolean {
  if (!Number.isFinite(value) || value <= 0) {
    return false;
  }
  if (range.min !== undefined && value < range.min) {
    return false;
  }
  if (range.max !== undefined && value > range.max) {
    return false;
  }
  return true;
}
