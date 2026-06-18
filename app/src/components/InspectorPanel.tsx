import type { InspectorItem } from "../engine/types";

interface InspectorPanelProps {
  item: InspectorItem;
  onHelp: () => void;
  canReadSource?: boolean;
  onReadSource?: () => void;
}

export function InspectorPanel({ canReadSource, item, onHelp, onReadSource }: InspectorPanelProps) {
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
      {item.typeLabel && <p className="inspector-type">{item.typeLabel}</p>}
      <p>{item.summary}</p>
      <dl className="inspector-fields">
        {item.plainLanguageMeaning && (
          <>
            <dt>Plain Meaning</dt>
            <dd>{item.plainLanguageMeaning}</dd>
          </>
        )}
        {item.sourceFile && (
          <>
            <dt>Source</dt>
            <dd>{item.relatedSource ?? item.sourceFile}</dd>
          </>
        )}
        {item.whyItMatters && (
          <>
            <dt>Why It Matters</dt>
            <dd>{item.whyItMatters}</dd>
          </>
        )}
        {item.affects && item.affects.length > 0 && (
          <>
            <dt>What It Affects</dt>
            <dd>{item.affects.join(", ")}</dd>
          </>
        )}
        {item.currentContext && (
          <>
            <dt>Current Run Context</dt>
            <dd>{item.currentContext}</dd>
          </>
        )}
        {item.suggestedNextAction && (
          <>
            <dt>Suggested Next Action</dt>
            <dd>{item.suggestedNextAction}</dd>
          </>
        )}
      </dl>
      {canReadSource && onReadSource && (
        <button className="secondary-action" onClick={onReadSource} type="button">
          Read Source
        </button>
      )}
      <ul className="compact-list">
        {item.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </section>
  );
}
