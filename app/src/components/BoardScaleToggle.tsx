import type { BoardScaleView } from "../engine/types";

interface BoardScaleToggleProps {
  value: BoardScaleView;
  onChange: (value: BoardScaleView) => void;
}

const views: Array<{ id: BoardScaleView; label: string }> = [
  { id: "room", label: "Room View" },
  { id: "society", label: "Society View" },
  { id: "archive", label: "Archive View" },
];

export function BoardScaleToggle({ value, onChange }: BoardScaleToggleProps) {
  return (
    <section className="scale-toggle" aria-label="Board scale">
      {views.map((view) => (
        <button
          className={value === view.id ? "selected" : ""}
          key={view.id}
          onClick={() => onChange(view.id)}
          type="button"
        >
          {view.label}
        </button>
      ))}
      <span>Nested Simulation: locked</span>
    </section>
  );
}
