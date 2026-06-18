import { agentPresentation } from "./agentPresentation";
import { haloLabel } from "./realityMetrics";
import { pressureLabels } from "./pressure";
import type {
  ActiveAgent,
  ArtifactData,
  HaloState,
  InspectorItem,
  LawState,
  MeterKey,
  Mode,
  RealityMetricSnapshot,
  RunState,
  SocietyNodeKey,
} from "./types";

const meterCopy: Record<MeterKey, { title: string; meaning: string; effect: string }> = {
  witness: {
    title: "Witness",
    meaning:
      "Witness measures how much attention has gathered around the event. When Witness rises, the room is no longer treating the event as background.",
    effect: "Higher Witness makes observation feel more reliable and can help form witness-based law.",
  },
  namedWeight: {
    title: "Named Weight",
    meaning:
      "Named Weight measures how much force a name has gained. When it rises, the room has a repeatable handle for the Boulder.",
    effect: "Higher Named Weight makes labels easier to repeat, archive, and turn into structure.",
  },
  institution: {
    title: "Institutional",
    meaning:
      "Institutional pressure measures how close the room is to treating an interpretation as a rule, record, ritual, or official structure.",
    effect: "Higher Institutional pressure makes the room more likely to harden a repeated pattern into law.",
  },
  concern: {
    title: "Concern",
    meaning:
      "Concern measures how risky or unstable the event feels to the room. When Concern rises, agents are more likely to read the event as a threat, problem, or unresolved pressure.",
    effect: "Higher Concern makes safety, trust, and available choices feel narrower.",
  },
  rufs: {
    title: "RUFS",
    meaning:
      "RUFS means Reality Units relative to Framed Society. It measures how loudly the room treats this event as real.",
    effect: "Higher RUFS means the event is harder for the wider frame to dismiss.",
  },
  mood: {
    title: "Mood Output",
    meaning:
      "Mood is the room's overall emotional condition. It is not the same as happiness. It is calculated from safety, agency, trust, meaning, and pressure.",
    effect: "Lower Mood means the same action may feel more threatening or constrained.",
  },
  safety: {
    title: "Safety",
    meaning: "Safety measures whether the room feels stable enough for agents to act without expecting harm.",
    effect: "Lower Safety makes fear and defensive interpretation more likely.",
  },
  agency: {
    title: "Agency",
    meaning: "Agency measures how much choice feels available inside the room.",
    effect: "Lower Agency makes rules, pressure, and architecture feel more controlling.",
  },
  trust: {
    title: "Trust",
    meaning: "Trust measures whether the room believes interpretation can be shared without becoming a trap.",
    effect: "Lower Trust makes agents more suspicious of names, records, and rules.",
  },
  meaning: {
    title: "Meaning",
    meaning: "Meaning measures how much symbolic weight the room has attached to the event.",
    effect: "Higher Meaning makes the event easier to remember, repeat, or inherit.",
  },
};

const haloCopy: Record<HaloState, string> = {
  dim: "Dim means this agent is carrying low signal right now. The room has not strongly activated them yet.",
  bright: "Bright means this agent has been activated by the room. They are carrying visible pressure.",
  pulsing: "Pulsing means pressure is rising for this agent. Their interpretation is becoming harder to ignore.",
  double: "Double means this agent is influencing social reality, not just reacting privately.",
  clipped: "Clipped means perception overload. The room feels unstable or too loud for this agent.",
};

function valueForMeter(metrics: RealityMetricSnapshot, key: MeterKey): number {
  if (key === "rufs") return metrics.rufs;
  if (key === "mood") return metrics.mood;
  if (key === "safety") return metrics.safety;
  if (key === "agency") return metrics.agency;
  if (key === "trust") return metrics.trust;
  if (key === "meaning") return metrics.meaning;
  return metrics.pressures[key];
}

function valueBand(value: number): string {
  if (value >= 70) return "high";
  if (value >= 35) return "moderate";
  if (value > 0) return "low but present";
  return "quiet";
}

export function explainMeter(
  key: MeterKey,
  history: RealityMetricSnapshot[],
  recentReason?: string,
): InspectorItem {
  const metrics = history.slice(-1)[0];
  const previous = history.length > 1 ? history[history.length - 2] : undefined;
  const copy = meterCopy[key];
  const value = metrics ? valueForMeter(metrics, key) : 0;
  const previousValue = previous ? valueForMeter(previous, key) : value;
  const delta = value - previousValue;
  const change =
    delta === 0
      ? `${copy.title} did not change on the last recorded turn.`
      : `${copy.title} ${delta > 0 ? "rose" : "fell"} by ${Math.abs(delta)} on the last recorded turn.`;

  return {
    id: `meter-${key}`,
    kind: "meter",
    title: copy.title,
    summary: `${copy.title} is ${value}/100. This is ${valueBand(value)}.`,
    details: [copy.meaning, `${change}${recentReason ? ` ${recentReason}` : ""}`, copy.effect],
  };
}

export function explainHalo(state: HaloState): InspectorItem {
  return {
    id: `halo-${state}`,
    kind: "halo",
    title: `${haloLabel(state)} Halo`,
    summary: haloCopy[state],
    details: ["The halo is a state indicator, not decoration. It shows how strongly the room is affecting an agent."],
  };
}

export function explainAgent(agent: ActiveAgent, mode: Mode): InspectorItem {
  const seed = agent.seeds[agent.activeSeed];
  const presentation = agentPresentation(agent);
  const memory =
    mode === "mystery" && !agent.lastReaction
      ? "Mystery mode is intentionally hiding the full active memory."
      : mode === "mystery"
        ? `A small hint is visible after reaction: ${seed.label}.`
        : mode === "vague"
          ? `Vague mode shows Life ${agent.activeSeed} and a partial hint: ${seed.label}.`
          : `Experimental mode shows Life ${agent.activeSeed}: ${seed.label}. ${seed.compactMemory}`;

  return {
    id: `agent-${agent.id}`,
    kind: "agent",
    title: agent.name,
    summary: `${agent.name} is represented by the ${presentation.tokenName}.`,
    details: [
      memory,
      `${presentation.haloLabel}: ${haloCopy[presentation.haloState]}`,
      `Current carried pressure: Witness ${agent.pressure.witness}, Named Weight ${agent.pressure.namedWeight}, Institutional ${agent.pressure.institution}, Concern ${agent.pressure.concern}.`,
      agent.lastReaction ?? "This agent has not reacted yet this run.",
      `Interpretation tendency: ${seed.distortion}`,
      `Story Boulders: ${agent.associatedBoulders.join(", ")}.`,
      `Emotional triggers: ${agent.emotionalTriggers.join(", ")}.`,
      `Preferred layers: ${agent.preferredLayers.join(", ")}. Feared layers: ${agent.fearedLayers.join(", ")}.`,
      `Story tendency: ${agent.interpretationTendencies.join(" ")}`,
    ],
  };
}

export function explainBoulder(state: RunState, artifact: ArtifactData): InspectorItem {
  const name = state.boulderName ?? artifact.name;

  return {
    id: "boulder",
    kind: "boulder",
    title: name,
    summary: "The Boulder is the visible event at the center of this build.",
    details: [
      `Current position: ${state.boulderPosition === "shifted" ? "shifted from the center path" : "center of the room"}.`,
      "Observing makes the event harder to ignore.",
      "Naming gives the event a repeatable handle.",
      "Moving changes the room's path and makes consequence visible.",
      `Current role: ${artifact.role}. ${artifact.description}`,
    ],
  };
}

export function explainLaw(law: LawState): InspectorItem {
  return {
    id: `law-${law.id}`,
    kind: "law",
    title: law.name,
    summary: "A law is an interpretation that hardened into structure.",
    details: [`Formed on turn ${law.formedTurn}.`, law.description],
  };
}

export function explainSocietyNode(key: SocietyNodeKey, state: RunState): InspectorItem {
  const latestInterpretation = state.interpretationHistory.slice(-1)[0]?.roomInterpretation ?? "No turn has been interpreted yet.";
  const latestObserver = state.observerInputs.slice(-1)[0];
  const latestMetrics = state.meterHistory.slice(-1)[0];
  const lawCount = state.laws.length;

  const nodeCopy: Record<SocietyNodeKey, InspectorItem> = {
    "boulder-room": {
      id: "society-boulder-room",
      kind: "society",
      title: "Boulder Room",
      summary: "This node is the local room where the current event is happening.",
      details: [latestInterpretation, "Local actions here feed the wider frame through attention, names, pressure, and law."],
    },
    "social-reality": {
      id: "society-social-reality",
      kind: "society",
      title: "Social Reality",
      summary: "This node shows what agents are beginning to repeat or accept together.",
      details: [state.layers.social.slice(-1)[0] ?? "No shared account has stabilized.", latestInterpretation],
    },
    "institutional-reality": {
      id: "society-institutional-reality",
      kind: "society",
      title: "Institutional Reality",
      summary: "This node shows whether interpretation is hardening into rule, record, ritual, or law.",
      details: [state.layers.institutional.slice(-1)[0] ?? "No law has formed.", `${lawCount} laws have formed this run.`],
    },
    laws: {
      id: "society-laws",
      kind: "society",
      title: "Laws",
      summary: "This node tracks interpretations that became enforceable structure.",
      details: [lawCount > 0 ? `${lawCount} law signal is active.` : "No law has formed yet.", "Law thresholds still respond to pressure."],
    },
    "observer-inputs": {
      id: "society-observer-inputs",
      kind: "society",
      title: "Observer Inputs",
      summary: "This node tracks text the player injected into the room.",
      details: latestObserver
        ? [`Latest input: "${latestObserver.text}".`, `Classified as ${latestObserver.classification}.`, latestObserver.interpretationNote]
        : ["No Observer Input has entered this run yet."],
    },
    "rufs-mood": {
      id: "society-rufs-mood",
      kind: "society",
      title: "RUFS / Mood",
      summary: "This node shows how loud reality feels and how stable the room feels.",
      details: latestMetrics
        ? [`RUFS ${latestMetrics.rufs}/100.`, `Mood ${latestMetrics.mood}/100: ${latestMetrics.label}.`]
        : ["No metric snapshot has been recorded yet."],
    },
    "nested-simulation": {
      id: "society-nested-simulation",
      kind: "society",
      title: "Nested Simulation: locked",
      summary: "The inner board is visible as a future possibility, but it is not simulated in v0.7.",
      details: ["Nothing inside this locked node changes mechanics yet.", "It marks that inherited myths and laws may matter later."],
    },
  };

  return nodeCopy[key];
}

export function defaultHelpItem(): InspectorItem {
  return {
    id: "help",
    kind: "help",
    title: "What am I looking at?",
    summary:
      "You are looking at a board where small actions become shared meaning. The Boulder is the event. The pieces are agents interpreting the event.",
    details: [
      "The meters show invisible pressure.",
      "The reality layers show how the event moves from physical action to belief, social agreement, and law.",
      "Click meters, pieces, halos, laws, story Boulders, layer cards, and society nodes to inspect what they mean.",
      "The main v0.7 action is choosing a source-derived story weight and introducing it to a character or the room.",
    ],
  };
}
