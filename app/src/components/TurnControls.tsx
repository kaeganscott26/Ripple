import type { BoulderAction, RulesData } from "../engine/types";

interface TurnControlsProps {
  rules: RulesData;
  selectedAction: BoulderAction;
  boulderNameInput: string;
  onActionChange: (action: BoulderAction) => void;
  onBoulderNameChange: (name: string) => void;
  onAdvance: () => void;
}

const actions: BoulderAction[] = ["observe", "name", "move", "ignore"];

export function TurnControls({
  rules,
  selectedAction,
  boulderNameInput,
  onActionChange,
  onBoulderNameChange,
  onAdvance,
}: TurnControlsProps) {
  return (
    <section className="panel turn-panel">
      <p className="eyebrow">Turn</p>
      <h2>Boulder Action</h2>
      <div className="action-grid">
        {actions.map((action) => (
          <button
            className={selectedAction === action ? "selected" : ""}
            key={action}
            onClick={() => onActionChange(action)}
            type="button"
          >
            <strong>{rules.actions[action].label}</strong>
            <span>{rules.actions[action].socialSignal}</span>
          </button>
        ))}
      </div>
      {selectedAction === "name" && (
        <label className="name-field">
          <span>Boulder Name</span>
          <input
            onChange={(event) => onBoulderNameChange(event.target.value)}
            placeholder="Consequence"
            type="text"
            value={boulderNameInput}
          />
        </label>
      )}
      <button className="primary-action" onClick={onAdvance} type="button">
        Advance Ripple
      </button>
    </section>
  );
}
