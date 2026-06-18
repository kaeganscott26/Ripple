export function formatMetricValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;

  return Number.isInteger(normalized) ? `${normalized}` : normalized.toFixed(1);
}

export function formatMetricDelta(delta: number): string {
  const formatted = formatMetricValue(Math.abs(delta));

  if (Number(formatted) === 0) return "0";
  return `${delta > 0 ? "+" : "-"}${formatted}`;
}

export function formatPercent(value: number): string {
  return `${formatMetricValue(value)}%`;
}
