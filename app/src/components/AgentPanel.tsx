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
          const memoryDetail = memoryLine(agent, mode);
          const fearDetail = fearLine(agent, mode);
          const behaviorDetail = behaviorLine(agent, mode);

          return (
            <article className="agent-card" key={agent.id}>
              <div className="agent-card-header">
                <div>
                  <strong>{agent.name}</strong>
                  <span>{agent.role}</span>
                </div>
                <span>{seedDisplay(agent, mode)}</span>
              </div>
              <dl className="agent-memory-grid">
                <dt>Memory</dt>
                <dd>{memoryDetail}</dd>
                <dt>Pressure</dt>
                <dd>{fearDetail}</dd>
                <dt>Ripple Behavior</dt>
                <dd>{behaviorDetail}</dd>
              </dl>
              {agent.lastReaction && <p className="last-reaction">{agent.lastReaction}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function memoryLine(agent: ActiveAgent, mode: Mode): string {
  const seed = agent.seeds[agent.activeSeed];

  if (mode === "mystery") {
    return agent.lastReaction ? `Hint after reaction: ${seed.label} pressure is active.` : "Hidden by Mystery mode.";
  }

  if (mode === "vague") {
    return `Life ${agent.activeSeed} hint: ${seed.label}.`;
  }

  return seed.compactMemory;
}

function fearLine(agent: ActiveAgent, mode: Mode): string {
  const seed = agent.seeds[agent.activeSeed];

  if (mode === "mystery") {
    return agent.lastReaction ? "A pressure has surfaced, but the full memory remains hidden." : "Hidden by Mystery mode.";
  }

  if (mode === "vague") {
    return `Partial pressure: ${seed.fear}`;
  }

  return seed.fear;
}

function behaviorLine(agent: ActiveAgent, mode: Mode): string {
  const seed = agent.seeds[agent.activeSeed];

  if (mode === "mystery") {
    return agent.lastReaction ? `Hint: ${seed.distortion}` : "Hidden by Mystery mode.";
  }

  if (mode === "vague") {
    return `Tends to ${seed.distortion.charAt(0).toLowerCase()}${seed.distortion.slice(1)}`;
  }

  return `${seed.distortion} Desire: ${seed.desire}`;
}
