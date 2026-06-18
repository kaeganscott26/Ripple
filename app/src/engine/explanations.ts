import { agentPresentation } from "./agentPresentation";
import { formatMetricDelta, formatMetricValue } from "./formatting";
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
  StoryBoulder,
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
  const formattedValue = formatMetricValue(value);
  const formattedPrevious = formatMetricValue(previousValue);
  const formattedDelta = formatMetricDelta(delta);
  const change =
    delta === 0
      ? `${copy.title} did not change on the last recorded turn.`
      : `${copy.title} ${delta > 0 ? "rose" : "fell"} by ${formatMetricValue(Math.abs(delta))} on the last recorded turn.`;
  const whyChanged = recentReason
    ? `Why it changed: ${recentReason}`
    : "Why it changed: no later turn has explained a specific cause yet.";

  return {
    id: `meter-${key}`,
    kind: "meter",
    title: copy.title,
    typeLabel: "Meter",
    summary: `${copy.title} is ${formattedValue}/100. This is ${valueBand(value)}.`,
    plainLanguageMeaning: copy.meaning,
    whyItMatters: copy.effect,
    affects: [copy.title, "Reality Layers", "Turn Feedback"],
    currentContext: `Current value ${formattedValue}/100. Previous value ${formattedPrevious}/100. Delta ${formattedDelta}.`,
    suggestedNextAction:
      key === "witness"
        ? "Inspect Social Reality or introduce a Story Weight to a character carrying witness pressure."
        : "Inspect the latest Turn Feedback, then introduce a Story Weight that touches this pressure.",
    currentValue: formattedValue,
    previousValue: formattedPrevious,
    delta: formattedDelta,
    details: [copy.meaning, `${change} ${whyChanged}`, copy.effect],
  };
}

export function explainHalo(state: HaloState): InspectorItem {
  return {
    id: `halo-${state}`,
    kind: "halo",
    title: `${haloLabel(state)} Halo`,
    typeLabel: "Agent Halo",
    summary: haloCopy[state],
    whyItMatters: "The halo tells you whether an agent is quiet, activated, overloaded, or shaping shared reality.",
    affects: ["Character targeting", "Agent interpretation", "Social Reality"],
    suggestedNextAction: "Inspect the agent piece to see what memory and pressure are carrying that halo.",
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
    typeLabel: "Character Piece",
    summary: `${agent.name} is represented by the ${presentation.tokenName}.`,
    plainLanguageMeaning: `${agent.name} is an interpreting agent. They do not just receive a Story Weight; they read it through memory, pressure, and role.`,
    whyItMatters: "Selecting this character makes the next Story Weight enter their reality instead of the room in general.",
    affects: ["Selected Target", "Agent halo", "Perceived Reality", "Story Weight interpretation"],
    currentContext: `${presentation.haloLabel}. ${agent.lastReaction ?? "No last-turn reaction yet."}`,
    suggestedNextAction: "Select a Story Weight connected to this character, inspect it, then read the Action Preview before introducing it.",
    details: [
      `Token identity: ${presentation.tokenName}.`,
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

export function explainBoulder(
  state: RunState,
  artifact: ArtifactData,
  selectedStoryBoulder?: StoryBoulder,
  selectedAgent?: ActiveAgent,
): InspectorItem {
  const name = state.boulderName ?? artifact.name;
  const targetName = selectedAgent?.name ?? "Room";
  const sourceLine = selectedStoryBoulder
    ? `${selectedStoryBoulder.name} is selected from ${selectedStoryBoulder.sourceChapter ?? selectedStoryBoulder.sourceFile}.`
    : "No Story Weight is selected.";

  return {
    id: "boulder",
    kind: "boulder",
    title: name,
    typeLabel: "Boulder",
    summary: "The Boulder is the visible event at the center of this build.",
    plainLanguageMeaning: "The Boulder is whatever weight the room cannot ignore yet.",
    whyItMatters: "It is the board's shared object: observing, naming, moving, ignoring, or replacing it with a Story Weight changes pressure.",
    affects: ["Witness", "Named Weight", "Institutional", "Concern", "Reality Layers"],
    currentContext: `Current position: ${state.boulderPosition === "shifted" ? "shifted from the center path" : "center of the room"}. Selected target: ${targetName}. ${sourceLine}`,
    suggestedNextAction: "Choose a Story Weight and read the Action Preview, or use a Legacy Boulder Action for a basic room turn.",
    details: [
      `Current position: ${state.boulderPosition === "shifted" ? "shifted from the center path" : "center of the room"}.`,
      `Selected target: ${targetName}.`,
      sourceLine,
      selectedStoryBoulder
        ? `If introduced now, ${selectedStoryBoulder.name} will enter ${targetName === "Room" ? "the room itself" : `${targetName}'s reality`} and push ${selectedStoryBoulder.relatedLayers.join(", ")}.`
        : "Select a Story Weight to preview the source relationship.",
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
    typeLabel: "Law Badge",
    summary: "A law is an interpretation that hardened into structure.",
    whyItMatters: "Laws show that repeated pressure has become more than mood; the room now treats it as structure.",
    affects: ["Institutional Reality", "Future pressure interpretation", "Run export"],
    currentContext: `Formed on turn ${law.formedTurn}.`,
    suggestedNextAction: "Inspect Institutional Reality or export the run if this law is the result you wanted to preserve.",
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
      typeLabel: "Society Node",
      summary: "This node is the local room where the current event is happening.",
      whyItMatters: "Local room pressure is what the wider society board receives.",
      affects: ["Social Reality", "Institutional Reality", "RUFS"],
      currentContext: latestInterpretation,
      suggestedNextAction: "Return to Room View and inspect the Boulder or the selected Story Weight.",
      details: [latestInterpretation, "Local actions here feed the wider frame through attention, names, pressure, and law."],
    },
    "social-reality": {
      id: "society-social-reality",
      kind: "society",
      title: "Social Reality",
      typeLabel: "Society Node",
      summary: "This node shows what agents are beginning to repeat or accept together.",
      whyItMatters: "Social Reality is where private readings become shared language.",
      affects: ["Witness", "Trust", "Meaning", "Law pressure"],
      currentContext: state.layers.social.slice(-1)[0] ?? "No shared account has stabilized.",
      suggestedNextAction: "Inspect Witness, Trust, or a Story Weight that changed the shared account.",
      details: [state.layers.social.slice(-1)[0] ?? "No shared account has stabilized.", latestInterpretation],
    },
    "institutional-reality": {
      id: "society-institutional-reality",
      kind: "society",
      title: "Institutional Reality",
      typeLabel: "Society Node",
      summary: "This node shows whether interpretation is hardening into rule, record, ritual, or law.",
      whyItMatters: "Institutional Reality tells you when the room is turning interpretation into procedure.",
      affects: ["Institutional", "Agency", "Safety", "Laws"],
      currentContext: state.layers.institutional.slice(-1)[0] ?? "No law has formed.",
      suggestedNextAction: "Inspect any law badge or choose a Story Weight with institutional pressure.",
      details: [state.layers.institutional.slice(-1)[0] ?? "No law has formed.", `${lawCount} laws have formed this run.`],
    },
    laws: {
      id: "society-laws",
      kind: "society",
      title: "Laws",
      typeLabel: "Society Node",
      summary: "This node tracks interpretations that became enforceable structure.",
      whyItMatters: "A law is the board showing that pressure has crossed into durable consequence.",
      affects: ["Institutional Reality", "Agency", "Run log"],
      currentContext: lawCount > 0 ? `${lawCount} law signal is active.` : "No law has formed yet.",
      suggestedNextAction: "Build pressure with Story Weights or inspect existing law badges.",
      details: [lawCount > 0 ? `${lawCount} law signal is active.` : "No law has formed yet.", "Law thresholds still respond to pressure."],
    },
    "observer-inputs": {
      id: "society-observer-inputs",
      kind: "society",
      title: "Observer Inputs",
      typeLabel: "Society Node",
      summary: "This node tracks text the player injected into the room.",
      whyItMatters: "Observer language can become a name, policy, doctrine, myth seed, or other room pressure.",
      affects: ["Named Weight", "Meaning", "Social Reality"],
      currentContext: latestObserver ? `Latest input: "${latestObserver.text}".` : "No Observer Input has entered this run yet.",
      suggestedNextAction: "Use Name the Boulder only when a basic room label is more useful than a Story Weight.",
      details: latestObserver
        ? [`Latest input: "${latestObserver.text}".`, `Classified as ${latestObserver.classification}.`, latestObserver.interpretationNote]
        : ["No Observer Input has entered this run yet."],
    },
    "rufs-mood": {
      id: "society-rufs-mood",
      kind: "society",
      title: "RUFS / Mood",
      typeLabel: "Society Node",
      summary: "This node shows how loud reality feels and how stable the room feels.",
      whyItMatters: "RUFS and Mood tell you whether the room is getting louder, safer, narrower, or more meaningful.",
      affects: ["Mood Output", "Safety", "Agency", "Trust", "Meaning"],
      currentContext: latestMetrics
        ? `RUFS ${formatMetricValue(latestMetrics.rufs)}/100. Mood ${formatMetricValue(latestMetrics.mood)}/100: ${latestMetrics.label}.`
        : "No metric snapshot has been recorded yet.",
      suggestedNextAction: "Tap RUFS, Mood, Safety, Agency, Trust, or Meaning for the exact meter explanation.",
      details: latestMetrics
        ? [`RUFS ${formatMetricValue(latestMetrics.rufs)}/100.`, `Mood ${formatMetricValue(latestMetrics.mood)}/100: ${latestMetrics.label}.`]
        : ["No metric snapshot has been recorded yet."],
    },
    "nested-simulation": {
      id: "society-nested-simulation",
      kind: "society",
      title: "Nested Simulation: locked",
      typeLabel: "Locked Society Node",
      summary: "The inner board is visible as a future possibility, but it is not simulated in v0.7.",
      whyItMatters: "It marks future inheritance and nested-world mechanics without pretending they are active yet.",
      affects: ["Nothing mechanical in this build"],
      currentContext: "Visible but locked.",
      suggestedNextAction: "Use Room View, Society View, or Archive View; Nested Simulation is not playable yet.",
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
    typeLabel: "Help",
    summary:
      "You are looking at a board where small actions become shared meaning. The Boulder is the event. The pieces are agents interpreting the event.",
    whyItMatters: "Ripple is a playable board loop supported by a readable source archive.",
    affects: ["Selected Weight", "Selected Target", "Inspector", "Archive View"],
    currentContext: "Choose a character or leave target as Room, choose a Story Weight, inspect it, read the preview, then introduce it.",
    suggestedNextAction: "Inspect a Story Weight or tap Archive View to read the source material.",
    details: [
      "The meters show invisible pressure.",
      "The reality layers show how the event moves from physical action to belief, social agreement, and law.",
      "Click meters, pieces, halos, laws, story Boulders, layer cards, and society nodes to inspect what they mean.",
      "The main v0.7 action is choosing a source-derived story weight and introducing it to a character or the room.",
    ],
  };
}
