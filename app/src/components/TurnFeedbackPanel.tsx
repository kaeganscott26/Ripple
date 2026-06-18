import type { TurnFeedback } from "../engine/types";
import { formatMetricDelta, formatMetricValue } from "../engine/formatting";

export function TurnFeedbackPanel({ feedback }: { feedback?: TurnFeedback }) {
  return (
    <section className="panel feedback-panel">
      <p className="eyebrow">Turn Feedback</p>
      <h2>{feedback ? `Turn ${feedback.turn} resolved` : "No ripple advanced yet"}</h2>

      {!feedback && <p className="quiet-line">Choose an action, then advance the ripple to see what changed.</p>}

      {feedback && (
        <>
          <dl className="feedback-summary">
            <dt>Processed Action</dt>
            <dd>{feedback.processedAction}</dd>
            <dt>Agent Reaction</dt>
            <dd>
              {feedback.agentReactionCount > 0
                ? `${feedback.agentReactionCount} agents reacted.`
                : "No agent reaction this turn."}
            </dd>
          </dl>

          <div>
            <h3>Observer Text</h3>
            {feedback.observerInput ? (
              <p>
                Classified as {feedback.observerInput.classification}: "{feedback.observerInput.text}".
              </p>
            ) : (
              <p className="quiet-line">No new Observer text classified this turn.</p>
            )}
          </div>

          <div>
            <h3>Room Interpretation</h3>
            <p>{feedback.interpretation.roomInterpretation}</p>
          </div>

          {feedback.storyObjectUse && (
            <div>
              <h3>Story Object</h3>
              <p>
                {feedback.storyObjectUse.objectName} entered {feedback.storyObjectUse.targetName ?? "the room"} from{" "}
                {feedback.storyObjectUse.sourceFile}.
              </p>
              <p>Meaning: {feedback.storyObjectUse.plainLanguageMeaning}</p>
              <p>What changed: {feedback.storyObjectUse.resultingInterpretation}</p>
            </div>
          )}

          {feedback.baseEvent && (
            <div>
              <h3>Layer Response</h3>
              <ul className="compact-list">
                <li>{feedback.baseEvent}</li>
                {feedback.perceivedReality && <li>{feedback.perceivedReality}</li>}
                {feedback.socialReality && <li>{feedback.socialReality}</li>}
                {feedback.institutionalPressure && <li>{feedback.institutionalPressure}</li>}
              </ul>
            </div>
          )}

          <div>
            <h3>Frame Readout</h3>
            <p>
              RUFS {formatMetricValue(feedback.metrics.rufs)}/100. Mood {formatMetricValue(feedback.metrics.mood)}/100: {feedback.metrics.label}.
            </p>
          </div>

          <div>
            <h3>Meter Changes</h3>
            {feedback.pressureChanges.length === 0 ? (
              <p className="quiet-line">No meter changed.</p>
            ) : (
              <ul className="compact-list">
                {feedback.pressureChanges.map((change) => (
                  <li key={change.key}>
                    {change.label}: {formatMetricValue(change.before)} to {formatMetricValue(change.after)} (
                    {formatMetricDelta(change.delta)})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3>Law Pressure</h3>
            <ul className="compact-list">
              {feedback.lawProgress.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>

          {feedback.formedLaws.length > 0 && (
            <div className="formed-law-callout">
              <h3>Law Formed</h3>
              {feedback.formedLaws.map((law) => (
                <p key={law.id}>
                  {law.name}: {law.description}
                </p>
              ))}
            </div>
          )}

          <details>
            <summary>Agent reactions</summary>
            <ul className="compact-list">
              {feedback.agentReactions.map((reaction) => (
                <li key={reaction}>{reaction}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
