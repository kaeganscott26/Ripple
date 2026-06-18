const terms = [
  ["Story Weight", "A piece of the archive enters the board and changes how the room interprets what is happening."],
  ["Boulder", "The original symbol for a weight the room cannot ignore."],
  ["Witness", "Attention gathers around an event."],
  ["Named Weight", "A label or story gains power because people can repeat it."],
  ["Institutional Pressure", "The room moves closer to turning an interpretation into a rule, record, or procedure."],
  ["Concern", "The room feels unresolved, risky, or unstable."],
  ["RUFS", "The room is treating something as more real. RUFS is rising."],
  ["Masking", "One story gets loud enough to hide another."],
  ["Law", "An interpretation became structure."],
  ["Layer", "A way of reading what kind of pressure is active."],
  ["Archive", "The source material the game is built from."],
  ["Nested Simulation", "The final locked goal: creating the next room from this room's memory, laws, and artifacts."],
];

export function LanguagePanel() {
  return (
    <section className="panel language-panel">
      <p className="eyebrow">Game Language</p>
      <h2>Plain Terms</h2>
      <dl>
        {terms.map(([term, meaning]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
