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
  { id: "mystery", label: "Mystery", detail: "Roll first. The board reveals what the space means after landing." },
  { id: "vague", label: "Vague", detail: "Public mode. Space names, plain explanations, and source links stay readable." },
  { id: "experimental", label: "Experimental", detail: "Engine room. Inspect possible futures before rolling." },
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
        <p className="eyebrow">Ripple v0.8.1</p>
        <h1>The Living Board</h1>
        <p>
          Ripple is a playable mirror of the INTERVENTION archive. Roll dice, move character pieces through symbolic rooms,
          land on Story Spaces, and watch interpretation become pressure, memory, law, and simulation.
        </p>
        <p className="setup-disclaimer">
          Ripple is a fictional, symbolic game and archive experience. It is not proof of simulation, a diagnosis tool, a
          command system, or a replacement for mental health care. If it feels too intense, pause or talk to someone you trust.
        </p>
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
        Start the Board
      </button>
    </section>
  );
}
