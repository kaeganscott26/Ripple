import { useEffect, useState } from "react";
import layerCardsJson from "./data/layerCards.json";
import { characterConfig, characterConfigs, gameModes, modeConfig } from "./data/gameConfig";
import { boardForCharacter } from "./data/boards";
import { realityLayerLabels } from "./data/liveBoard";
import { advanceWithRoll, collectArtifact, createRippleGame, ignoreArtifact } from "./engine/rippleGame";
import { rippleLensExplanations } from "./engine/aiGlass";
import type { ArtifactState, GameModeId, LifeBoardSpace, RippleGameState, RippleLens } from "./engine/gameTypes";
import type { LayerCard } from "./engine/types";

const savedRunKey = "ripple-canonical-run-v4";
const layerCards = layerCardsJson as LayerCard[];
type View = "board" | "inventory" | "reference";

function loadRun(): RippleGameState | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(savedRunKey) ?? "null") as RippleGameState | null;
    return parsed?.version === 4 && characterConfigs.some((character) => character.id === parsed.characterId) ? parsed : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState<GameModeId>("vague");
  const [selectedCharacter, setSelectedCharacter] = useState(characterConfigs[0].id);
  const [game, setGame] = useState<RippleGameState | null>(() => loadRun());
  const [view, setView] = useState<View>("board");

  useEffect(() => {
    if (game) window.localStorage.setItem(savedRunKey, JSON.stringify(game));
  }, [game]);

  function reset() {
    window.localStorage.removeItem(savedRunKey);
    setGame(null);
    setView("board");
  }

  if (!game) {
    return (
      <main className="app canonical-app">
        <section className="canonical-setup">
          <div className="setup-copy">
            <p className="eyebrow">Ripple / New Canon</p>
            <h1>Enter the living board.</h1>
            <p>Choose a mode, choose one character, then cross the board through riddles, artifacts, and consequences.</p>
            <p className="setup-disclaimer">
              Fictional and symbolic. The glass offers story material—not diagnosis, prophecy, proof, or instruction.
            </p>
          </div>

          <section className="setup-step">
            <p className="step-number">01 / Select mode</p>
            <div className="mode-grid">
              {gameModes.map((mode) => (
                <button
                  className={`mode-card ${selectedMode === mode.id ? "selected" : ""}`}
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  type="button"
                >
                  <strong>{mode.name}</strong>
                  <span>{mode.summary}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="setup-step">
            <p className="step-number">02 / Select one character</p>
            <div className="character-select-grid">
              {characterConfigs.map((character) => (
                <button
                  className={`character-select-card ${selectedCharacter === character.id ? "selected" : ""}`}
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.id)}
                  type="button"
                >
                  <span>{character.role}</span>
                  <strong>{character.name}</strong>
                  <small>{character.question}</small>
                </button>
              ))}
            </div>
          </section>

          <button
            className="primary-action begin-run"
            onClick={() => setGame(createRippleGame({ modeId: selectedMode, characterId: selectedCharacter }))}
            type="button"
          >
            Begin as {characterConfig(selectedCharacter).name}
          </button>
        </section>
      </main>
    );
  }

  const character = characterConfig(game.characterId);
  const mode = modeConfig(game.modeId);
  const board = boardForCharacter(game.characterId);
  const currentSpace = board.spaces[game.position];
  const authoredSpace = board.authored?.spaces[game.position] as LifeBoardSpace | undefined;

  return (
    <main className="app canonical-app">
      <header className="canonical-topbar">
        <div>
          <p className="eyebrow">Ripple / {mode.name}</p>
          <h1>{character.name}'s run</h1>
          <p>{character.role} · {character.question}</p>
          <p className="board-identity">{board.name} · Space {game.position + 1} of {board.totalSpaces}</p>
        </div>
        <div className="topbar-actions">
          <button className="ghost-action" onClick={reset} type="button">New run</button>
        </div>
      </header>

      <nav className="secondary-nav" aria-label="Game views">
        {(["board", "inventory"] as View[]).map((item) => (
          <button className={view === item ? "selected" : ""} key={item} onClick={() => setView(item)} type="button">
            {item}
          </button>
        ))}
        {mode.referenceAccess !== "hidden" && (
          <button className={view === "reference" ? "selected" : ""} onClick={() => setView("reference")} type="button">
            optional reference
          </button>
        )}
      </nav>

      {view === "board" && game.phase !== "complete" && (
        <section className="canonical-board-layout">
          <BoardTrack game={game} />
          <aside className="glass-console">
            <section className="center-glass-v1" aria-live="polite">
              <p className="eyebrow">Center Glass · Space {game.position + 1} / {board.totalSpaces}</p>
              <div className="glass-symbol">{currentSpace.symbol}</div>
              <h2>{game.pendingChoice?.glassPrompt.output ?? authoredSpace?.glassRiddle ?? "The glass is waiting."}</h2>
              <p className="glass-space-name">
                {currentSpace.name}
                {authoredSpace ? ` · ${authoredSpace.zone}` : ""}
                {mode.revealsLayer ? ` · ${authoredSpace?.realityLayers.join(" / ") ?? realityLayerLabels[currentSpace.realityLayer]}` : ""}
              </p>
              {game.pendingChoice && authoredSpace && (
                <div className="authored-space-card">
                  <p><strong>Artifact</strong> {authoredSpace.artifact}</p>
                  <p>{authoredSpace.storySeed}</p>
                  <dl>
                    <div><dt>Collect</dt><dd>{authoredSpace.collectMeaning}</dd></div>
                    <div><dt>Ignore</dt><dd>{authoredSpace.ignoreMeaning}</dd></div>
                    <div><dt>Forced consequence</dt><dd>{authoredSpace.forcedConsequence}</dd></div>
                  </dl>
                </div>
              )}
            </section>

            <DiceConsole game={game} onRoll={() => setGame((state) => state ? advanceWithRoll(state) : state)} />

            {game.pendingChoice && (
              <section className="artifact-choice">
                <p className="eyebrow">Artifact offered</p>
                <h3>{game.pendingChoice.artifact.artifactName}</h3>
                <p>{game.boardRun.last_glass_reached
                  ? "The Last Glass resolves the run."
                  : game.lastRoll?.lens === "Intervention"
                    ? "Collect it, or ignore it without moving back."
                    : "Collect it, or ignore it and move back one space to receive that space's consequence."}</p>
                <div className="choice-actions">
                  <button className="primary-action" onClick={() => setGame(collectArtifact(game))} type="button">
                    {game.boardRun.last_glass_reached ? "Enter Last Glass" : "Collect"}
                  </button>
                  {!game.boardRun.last_glass_reached && <button className="secondary-action" onClick={() => setGame(ignoreArtifact(game))} type="button">Ignore</button>}
                </div>
              </section>
            )}

            {game.modeId === "experimental" && game.pendingChoice && (
              <details className="prompt-inspector">
                <summary>Inspect glass prompt</summary>
                <pre>{game.pendingChoice.glassPrompt.user}</pre>
                <ul>{game.pendingChoice.glassPrompt.constraints.map((rule) => <li key={rule}>{rule}</li>)}</ul>
              </details>
            )}
          </aside>
        </section>
      )}

      {view === "board" && game.phase === "complete" && game.finalStory && (
        <EndingStory game={game} />
      )}

      {view === "inventory" && <InventoryView game={game} />}
      {view === "reference" && mode.referenceAccess !== "hidden" && <ReferenceView expanded={mode.referenceAccess === "expanded"} />}
    </main>
  );
}

function BoardTrack({ game }: { game: RippleGameState }) {
  const board = boardForCharacter(game.characterId);
  return (
    <section className="canonical-board" aria-label="Ripple board">
      <div className="board-dataset-line">
        <span>{board.name}</span>
        <span>{game.position + 1} / {board.totalSpaces}</span>
      </div>
      <div className="canonical-space-grid">
        {board.spaces.map((space, index) => {
          const current = index === game.position;
          const passed = index < game.position;
          const emphasized = game.boardRun.emphasized_spaces.includes(index + 1);
          return (
            <article className={`canonical-space ${current ? "current" : ""} ${passed ? "passed" : ""} ${emphasized ? "emphasized" : ""}`} key={space.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i>{space.symbol}</i>
              <strong>{game.modeId === "mystery" && !current && !passed ? "Unrevealed" : space.name}</strong>
              {game.modeId === "experimental" && <small>{board.authored?.spaces[index]?.zone ?? realityLayerLabels[space.realityLayer]}</small>}
              {current && <b aria-label={`${characterConfig(game.characterId).name} is here`}>{characterConfig(game.characterId).name.slice(0, 1)}</b>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DiceConsole({ game, onRoll }: { game: RippleGameState; onRoll: () => void }) {
  const roll = game.lastRoll;
  return (
    <section className="dice-console-v1">
      <div>
        <p className="eyebrow">Two dice · two roles</p>
        <div className="dice-row-v1">
          <Die label="Movement" value={roll?.movementDie} />
          <Die label="Ripple" value={roll?.rippleDie} />
        </div>
      </div>
      {roll && (
        <div className="dice-result-v1">
          <p><strong>Movement Die:</strong> {roll.movementDie}</p>
          <p><strong>Ripple Die:</strong> {roll.rippleDie} — {roll.lens}</p>
          <p><strong>Move:</strong> {roll.total} spaces</p>
          <p>{rippleLensExplanations[roll.lens]}</p>
        </div>
      )}
      <button className="primary-action" disabled={game.phase !== "playing"} onClick={onRoll} type="button">
        {game.turn === 0 ? "Roll two dice" : "Roll again"}
      </button>
    </section>
  );
}

function Die({ label, value }: { label: string; value?: number }) {
  return <div className="die-v1"><span>{label}</span><strong>{value ?? "–"}</strong></div>;
}

const inventoryLabels: Record<ArtifactState, string> = {
  missed: "Missed while moving",
  collected: "Collected",
  ignored: "Ignored",
  forced: "Forced consequences",
};

function InventoryView({ game }: { game: RippleGameState }) {
  return (
    <section className="secondary-view inventory-view-v1">
      <div className="view-header"><p className="eyebrow">Run memory</p><h2>Artifact states</h2></div>
      <div className="inventory-state-grid">
        {(Object.keys(inventoryLabels) as ArtifactState[]).map((state) => (
          <article className={`inventory-column state-${state}`} key={state}>
            <h3>{inventoryLabels[state]} <span>{game.inventory[state].length}</span></h3>
            {game.inventory[state].length === 0 && <p className="quiet-line">Nothing recorded.</p>}
            {game.inventory[state].map((artifact) => (
              <div className="artifact-record" key={artifact.id}>
                <strong>{artifact.artifactName}</strong>
                <span>{artifact.spaceName}</span>
                <small>{artifact.glassFragment}</small>
                {artifact.consequence && <p>{artifact.consequence}</p>}
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function ReferenceView({ expanded }: { expanded: boolean }) {
  return (
    <section className="secondary-view">
      <div className="view-header">
        <p className="eyebrow">Optional reference</p>
        <h2>Glossary & reality layers</h2>
        <p>You do not need this material to play. It supplies vocabulary and guardrails, not direct game events.</p>
      </div>
      <div className="glossary-grid">
        {layerCards.map((card) => (
          <article className="panel" key={card.id}>
            <h3>{card.name}</h3>
            <p>{card.plainLanguageMeaning}</p>
            {expanded && <><p>{card.inspectorExplanation}</p><small>{card.sourceFile}</small></>}
          </article>
        ))}
      </div>
    </section>
  );
}

function EndingStory({ game }: { game: RippleGameState }) {
  const story = game.finalStory;
  if (!story) return null;
  return (
    <section className="ending-story">
      <p className="eyebrow">The glass opens / A complete fiction</p>
      <h2>{story.title}</h2>
      <div className="story-prose">{story.story.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <RunSummary game={game} />
      {game.modeId === "experimental" && (
        <details className="prompt-inspector"><summary>Inspect final story prompt</summary><pre>{story.prompt.user}</pre></details>
      )}
    </section>
  );
}

function RunSummary({ game }: { game: RippleGameState }) {
  const board = boardForCharacter(game.characterId);
  const run = game.boardRun;
  const showExactBranches = game.modeId === "experimental";
  const lensCounts = run.ripple_lens_history.reduce<Partial<Record<RippleLens, number>>>((counts, lens) => {
    counts[lens] = (counts[lens] ?? 0) + 1;
    return counts;
  }, {});
  const dominantLens = (Object.entries(lensCounts) as [RippleLens, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
  const forkGroups = Array.from(new Set(run.lens_effects.filter((effect) => effect.lens === "Fork").map((effect) => effect.branchGroup).filter(Boolean)));
  return (
    <section className="run-summary">
      <p className="eyebrow">Run summary / Mechanics</p>
      <h3>{board.name}</h3>
      <div className="run-summary-grid">
        <p><strong>{run.turn_count}</strong><span>turns</span></p>
        <p><strong>{run.spaces_collected.length}</strong><span>collected</span></p>
        <p><strong>{run.spaces_ignored.length}</strong><span>ignored</span></p>
        <p><strong>{run.spaces_missed.length}</strong><span>missed</span></p>
        <p><strong>{run.spaces_forced.length}</strong><span>forced</span></p>
      </div>
      <p><strong>Dominant zones:</strong> {run.dominant_zones.join(", ") || "No dominant zone"}</p>
      <p><strong>Ripple Die history:</strong> {run.dice_history.map((roll) => roll.rippleDie).join(", ") || "No rolls"}</p>
      <p><strong>Dominant lens:</strong> {dominantLens ?? "No dominant lens"}</p>
      <p><strong>Amplified spaces:</strong> {run.amplified_spaces.join(", ") || "none"}</p>
      <p><strong>Echo links:</strong> {run.echo_links.map((link) => `${link.fromSpace} → ${link.toSpace}`).join(", ") || "none"}</p>
      <p><strong>Interventions used:</strong> {run.intervention_turns_used}</p>
      <p><strong>Fork branch groups:</strong> {forkGroups.join(", ") || "none"}</p>
      <p><strong>Final response:</strong> {run.final_response.replace(/_/g, " ")}</p>
      {game.modeId === "vague" && run.unresolved_branch_pairs.length > 0 && (
        <p>Unresolved branches quietly changed this ending.</p>
      )}
      {showExactBranches && (
        <div className="branch-summary">
          <h4>Branch resolutions</h4>
          {run.resolved_branch_pairs.map((pair) => (
            <p key={pair.group}><strong>{pair.group.replace(/_/g, " ")}:</strong> {pair.resolution} <span>({pair.kind})</span></p>
          ))}
          <p><strong>Missed pairs:</strong> {run.unresolved_branch_pairs.join(", ") || "none"}</p>
        </div>
      )}
    </section>
  );
}
