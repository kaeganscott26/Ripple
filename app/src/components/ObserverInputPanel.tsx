import type { ObserverInputClassification } from "../engine/types";

export function ObserverInputPanel({ input }: { input?: ObserverInputClassification }) {
  return (
    <section className="panel observer-input-panel">
      <p className="eyebrow">Observer Input</p>
      <h2>{input ? input.classification : "No classified input yet"}</h2>

      {!input && (
        <p className="quiet-line">
          Use Name the Boulder to let the player's language enter the room as a name, crisis, policy, doctrine,
          era marker, or myth seed.
        </p>
      )}

      {input && (
        <dl>
          <dt>Latest Text</dt>
          <dd>"{input.text}"</dd>
          <dt>Classified As</dt>
          <dd>{input.classification}</dd>
          <dt>Why</dt>
          <dd>{input.explanation}</dd>
          <dt>Interpretation</dt>
          <dd>{input.interpretationNote}</dd>
        </dl>
      )}
    </section>
  );
}
