const steps = [
  "Choose an action for the Boulder.",
  "Advance the ripple to process the turn.",
  "Watch the meters for pressure changes.",
  "Read the reality layers to see how the room interprets the turn.",
  "Try to trigger a law by building enough pressure.",
  "Export the run when the result is worth archiving.",
];

export function HowToPlayPanel() {
  return (
    <section className="panel how-to-panel">
      <p className="eyebrow">How to Play</p>
      <h2>Turn Loop</h2>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
