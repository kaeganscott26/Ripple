import type { InspectorItem } from "../engine/types";

interface InspectorPanelProps {
  item: InspectorItem;
  onHelp: () => void;
}

export function InspectorPanel({ item, onHelp }: InspectorPanelProps) {
  return (
    <section className="panel inspector-panel">
      <div className="inspector-header">
        <div>
          <p className="eyebrow">Inspector</p>
          <h2>{item.title}</h2>
        </div>
        <button className="ghost-action compact-action" onClick={onHelp} type="button">
          Help
        </button>
      </div>
      <p>{item.summary}</p>
      <ul className="compact-list">
        {item.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </section>
  );
}
