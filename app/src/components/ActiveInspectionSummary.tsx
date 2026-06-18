import type { InspectorItem } from "../engine/types";

interface ActiveInspectionSummaryProps {
  item: InspectorItem;
  selectedWeightName?: string;
  selectedTargetName?: string;
  canReadSource?: boolean;
  compactByDefault?: boolean;
  onReadSource?: () => void;
}

export function ActiveInspectionSummary({
  canReadSource,
  compactByDefault,
  item,
  onReadSource,
  selectedTargetName,
  selectedWeightName,
}: ActiveInspectionSummaryProps) {
  return (
    <details className="active-inspection-strip" aria-live="polite" open={!compactByDefault}>
      <summary>
        <div>
          <span>Inspecting</span>
          <strong>{item.title}</strong>
        </div>
        {selectedWeightName && (
          <div>
            <span>Weight</span>
            <strong>{selectedWeightName}</strong>
          </div>
        )}
        <div>
          <span>Target</span>
          <strong>{selectedTargetName ?? "Room"}</strong>
        </div>
        {item.sourceFile && (
          <div>
            <span>Source</span>
            <strong>{item.relatedSource ?? item.sourceFile}</strong>
          </div>
        )}
      </summary>
      <div className="active-inspection-details">
        <p>{item.plainLanguageMeaning ?? item.summary}</p>
        {item.affects && item.affects.length > 0 && <p>Affects: {item.affects.slice(0, 4).join(", ")}.</p>}
        {item.suggestedNextAction && <p>Next: {item.suggestedNextAction}</p>}
        {canReadSource && onReadSource && (
          <button className="secondary-action compact-action" onClick={onReadSource} type="button">
            Read Source
          </button>
        )}
      </div>
    </details>
  );
}
