import type { EventEntry } from "../engine/types";
import { eventTypeLabel } from "../engine/eventLabels";

export function EventLog({ events }: { events: EventEntry[] }) {
  return (
    <section className="panel event-panel">
      <p className="eyebrow">Archive</p>
      <h2>Event Log</h2>
      <div className="event-list">
        {events.length === 0 && <p className="quiet-line">No turns recorded yet.</p>}
        {events
          .slice()
          .reverse()
          .map((event) => (
            <article className={`event-entry ${event.type}`} key={event.id}>
              <span>
                Turn {event.turn} / {eventTypeLabel(event.type)}
              </span>
              <p>{event.text}</p>
            </article>
          ))}
      </div>
    </section>
  );
}
