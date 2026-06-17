import type { RunState } from "../engine/types";
import { downloadMarkdownRunLog } from "../engine/runLog";

export function ExportRunButton({ state }: { state: RunState }) {
  return (
    <button className="secondary-action" onClick={() => downloadMarkdownRunLog(state)} type="button">
      Export Markdown Run Log
    </button>
  );
}
