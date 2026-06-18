import type { InspectorItem } from "../engine/types";

interface ActiveInspectionSummaryProps {
  item: InspectorItem;
  selectedWeightName?: string;
  selectedTargetName?: string;
  canReadSource?: boolean;
  onReadSource?: () => void;
}

export function ActiveInspectionSummary({
  canReadSource,
  item,
  onReadSource,
  selectedTargetName,
  selectedWeightName,
}: ActiveInspectionSummaryProps) {
  return (
    <section className="active-inspection-strip" aria-live="polite">
      <div>
        <span>Inspecting</span>
        <strong>{item.title}</strong>
      </div>
      {selectedWeightName && (
        <div>
          <span>Selected Weight</span>
          <strong>{selectedWeightName}</strong>
        </div>
      )}
      <div>
        <span>Target</span>
        <strong>{selectedTargetName ?? "Room"}</strong>
      </div>
      <p>{item.plainLanguageMeaning ?? item.summary}</p>
      {item.affects && item.affects.length > 0 && <p>Affects: {item.affects.slice(0, 4).join(", ")}.</p>}
      {item.sourceFile && <p>Source: {item.relatedSource ?? item.sourceFile}</p>}
      {item.suggestedNextAction && <p>Next: {item.suggestedNextAction}</p>}
      {canReadSource && onReadSource && (
        <button className="secondary-action compact-action" onClick={onReadSource} type="button">
          Read Source
        </button>
      )}
    </section>
  );
}
