export const howToPlaySteps = [
  "Choose a mode.",
  "Select a character or leave the target as Room.",
  "Choose a Story Weight.",
  "Tap Inspect whenever something is unclear.",
  "Read the Action Preview.",
  "Introduce the selected weight.",
  "Watch meters, halos, reality layers, and Society View change.",
  "Use Archive View to read the source story.",
  "Export the run when it becomes worth archiving.",
  "Use Basic Room Actions only when you want a simple Observe, Move, Name, or Ignore turn.",
];

export function HowToPlayPanel() {
  return (
    <section className="panel how-to-panel">
      <p className="eyebrow">How to Play</p>
      <h2>Story Weight Loop</h2>
      <ol>
        {howToPlaySteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
