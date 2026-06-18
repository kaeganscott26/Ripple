import type { RunState } from "../engine/types";
import { downloadMarkdownRunLog } from "../engine/runLog";

export function ExportRunButton({ onExport, state }: { onExport?: () => void; state: RunState }) {
  return (
    <button
      className="secondary-action"
      onClick={() => {
        downloadMarkdownRunLog({ ...state, exportedRun: true });
        onExport?.();
      }}
      type="button"
    >
      Export Markdown Run Log
    </button>
  );
}
