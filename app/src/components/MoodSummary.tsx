import type { CSSProperties } from "react";
import type { RealityMetricSnapshot } from "../engine/types";

export function MoodSummary({ metrics }: { metrics?: RealityMetricSnapshot }) {
  if (!metrics) {
    return null;
  }

  return (
    <section className="panel mood-panel">
      <p className="eyebrow">Mood Output</p>
      <h2>
        {metrics.label} <span>{metrics.mood}/100</span>
      </h2>
      <div className="driver-grid">
        <Driver label="Safety" value={metrics.safety} />
        <Driver label="Agency" value={metrics.agency} />
        <Driver label="Trust" value={metrics.trust} />
        <Driver label="Meaning" value={metrics.meaning} />
      </div>
      <p className="quiet-line">Happiness is an output. RUFS is the loudness of perceived reality.</p>
    </section>
  );
}

function Driver({ label, value }: { label: string; value: number }) {
  return (
    <div className="driver-meter">
      <span>{label}</span>
      <strong>{value}</strong>
      <i style={{ "--driver-level": `${value}%` } as CSSProperties} />
    </div>
  );
}
