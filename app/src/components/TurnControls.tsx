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
  const selectedRule = rules.actions[selectedAction];

  return (
    <section className="panel turn-panel">
      <p className="eyebrow">Turn</p>
      <h2>Legacy Boulder Actions</h2>
      <p className="quiet-line">Use these when you want to observe, move, name, or refuse the general room weight.</p>
      <div className="action-grid">
        {actions.map((action) => (
          <button
            className={selectedAction === action ? "selected" : ""}
            aria-pressed={selectedAction === action}
            key={action}
            onClick={() => onActionChange(action)}
            type="button"
          >
            {selectedAction === action && <span className="selected-label">Selected</span>}
            <strong>{rules.actions[action].label}</strong>
            <span>{rules.actions[action].socialSignal}</span>
          </button>
        ))}
      </div>
      <div className="selected-action-summary">
        <span>Selected action</span>
        <strong>{selectedRule.label}</strong>
        <p>{selectedRule.baseEvent}</p>
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
