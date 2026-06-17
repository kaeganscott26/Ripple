import type { AgentData, Mode, SeedKey, SetupSelection } from "../engine/types";

interface ModeSelectProps {
  agents: AgentData[];
  selectedMode: Mode;
  selectedSeeds: Record<string, SeedKey>;
  onModeChange: (mode: Mode) => void;
  onSeedChange: (agentId: string, seed: SeedKey) => void;
  onStart: (selection: SetupSelection) => void;
}

const modes: Array<{ id: Mode; label: string; detail: string }> = [
  { id: "mystery", label: "Mystery", detail: "The board remembers for you. Seeds stay hidden." },
  { id: "vague", label: "Vague", detail: "Choose A, B, or C without seeing the meaning." },
  { id: "experimental", label: "Experimental", detail: "Choose seeds with compact meanings visible." },
];

const seedKeys: SeedKey[] = ["A", "B", "C"];

export function ModeSelect({
  agents,
  selectedMode,
  selectedSeeds,
  onModeChange,
  onSeedChange,
  onStart,
}: ModeSelectProps) {
  return (
    <section className="setup-screen">
      <div className="setup-copy">
        <p className="eyebrow">Ripple: The Boulder Build v0.5</p>
        <h1>The room is waiting.</h1>
      </div>

      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            className={`mode-card ${selectedMode === mode.id ? "selected" : ""}`}
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            type="button"
          >
            <strong>{mode.label}</strong>
            <span>{mode.detail}</span>
          </button>
        ))}
      </div>

      {selectedMode !== "mystery" && (
        <div className="seed-table">
          {agents.map((agent) => (
            <div className="seed-row" key={agent.id}>
              <div>
                <strong>{agent.name}</strong>
                <span>{agent.role}</span>
              </div>
              <div className="seed-options" role="group" aria-label={`${agent.name} memory seed`}>
                {seedKeys.map((seed) => (
                  <button
                    className={selectedSeeds[agent.id] === seed ? "selected" : ""}
                    key={seed}
                    onClick={() => onSeedChange(agent.id, seed)}
                    type="button"
                  >
                    {seed}
                  </button>
                ))}
              </div>
              {selectedMode === "experimental" && (
                <p className="seed-meaning">
                  Life {selectedSeeds[agent.id]}: {agent.seeds[selectedSeeds[agent.id]].label} -{" "}
                  {agent.seeds[selectedSeeds[agent.id]].compactMemory}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="primary-action"
        onClick={() => onStart({ mode: selectedMode, selectedSeeds })}
        type="button"
      >
        Enter Boulder Room
      </button>
    </section>
  );
}
