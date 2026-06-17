import type { EventType } from "./types";

const labels: Record<EventType, string> = {
  base: "Base",
  observer: "Observer Input",
  agent: "Agent",
  social: "Social",
  institutional: "Institutional",
  law: "Law",
};

export function eventTypeLabel(type: EventType): string {
  return labels[type];
}
