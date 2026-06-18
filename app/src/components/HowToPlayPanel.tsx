export const howToPlaySteps = [
  "Choose a mode.",
  "Current character rolls dice.",
  "Move the piece to the landing Story Space.",
  "Read what the board reveals.",
  "Watch the character interpretation, meters, halos, and layers change.",
  "Move to the next character.",
  "After every character acts, read the round summary and Society View.",
  "Use Archive View to read the source story.",
  "Use Manual Story Weight tools in Experimental mode when you want direct archive play.",
  "Export the run when it becomes worth archiving.",
];

export function HowToPlayPanel() {
  return (
    <section className="panel how-to-panel">
      <p className="eyebrow">How to Play</p>
      <h2>Board Loop</h2>
      <ol>
        {howToPlaySteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
