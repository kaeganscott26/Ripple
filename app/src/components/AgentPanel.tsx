import type { ActiveAgent, Mode } from "../engine/types";
import { seedDisplay } from "../engine/memorySystem";

interface AgentPanelProps {
  agents: ActiveAgent[];
  mode: Mode;
}

export function AgentPanel({ agents, mode }: AgentPanelProps) {
  return (
    <section className="panel agent-panel">
      <p className="eyebrow">Active Agents</p>
      <h2>Remembered Cast</h2>
      <div className="agent-list">
        {agents.map((agent) => {
          const seed = agent.seeds[agent.activeSeed];
          return (
            <article className="agent-card" key={agent.id}>
              <div>
                <strong>{agent.name}</strong>
                <span>{seedDisplay(agent, mode)}</span>
              </div>
              {mode !== "mystery" && (
                <p>
                  {seed.compactMemory} Fear: {seed.fear}
                </p>
              )}
              {agent.lastReaction && <p className="last-reaction">{agent.lastReaction}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
