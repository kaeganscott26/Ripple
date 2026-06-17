import type { RealityLayers } from "../engine/types";

const layerLabels: Array<{ key: keyof RealityLayers; label: string }> = [
  { key: "base", label: "Base Reality" },
  { key: "perceived", label: "Perceived Reality" },
  { key: "social", label: "Social Reality" },
  { key: "institutional", label: "Institutional Reality" },
];

export function RealityLayerPanel({ layers }: { layers: RealityLayers }) {
  return (
    <section className="panel layer-panel">
      <p className="eyebrow">Reality Layers</p>
      <h2>Room State</h2>
      <div className="layer-grid">
        {layerLabels.map((layer) => (
          <article className="layer-card" key={layer.key}>
            <h3>{layer.label}</h3>
            <ul>
              {layers[layer.key].map((entry, index) => (
                <li key={`${layer.key}-${index}`}>{entry}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
