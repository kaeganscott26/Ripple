import { describe, expect, it } from "vitest";
import { boardSpaces, liveBoard } from "../data/liveBoard";
import { boardForCharacter, teodorScottBoard } from "../data/boards";
import { buildRippleRiddlePrompt, influenceFor } from "./aiGlass";
import { advanceWithRoll, collectArtifact, createRippleGame, ignoreArtifact, rollDice } from "./rippleGame";
import type { DiceRoll } from "./gameTypes";

function roll(movementDie: number, rippleDie = 3): DiceRoll {
  return { movementDie, rippleDie, total: movementDie, lens: influenceFor(rippleDie) };
}

describe("canonical Ripple loop", () => {
  it("loads the authored 72-space life-board only for Teodor / Scott", () => {
    const board = boardForCharacter("teodor-scott");

    expect(board.totalSpaces).toBe(72);
    expect(board.spaces).toHaveLength(72);
    expect(board.spaces[0].name).toBe("Adoption");
    expect(board.spaces[71].name).toBe("Last Glass");
    expect(teodorScottBoard.fixedAnchors).toEqual([1, 4, 18, 25, 29, 41, 49, 57, 61, 65, 72]);
    expect(teodorScottBoard.branchGroups).toHaveLength(17);
    expect(boardForCharacter("mara").totalSpaces).toBe(boardSpaces.length);
  });

  it("keeps every authored Teodor / Scott card field in bundled static data", () => {
    expect(teodorScottBoard.spaces.every((space) =>
      space.number > 0 && space.name && space.zone && space.type && space.realityLayer &&
      space.glassRiddle && space.artifact && space.storySeed && space.collectMeaning &&
      space.ignoreMeaning && space.missedMeaning && space.forcedConsequence &&
      space.booleanTags.length > 0 && space.endingInfluence,
    )).toBe(true);
  });

  it("begins the Teodor / Scott board at Adoption and records the chosen anchor state", () => {
    const initial = createRippleGame({ modeId: "vague", characterId: "teodor-scott" });
    expect(initial.phase).toBe("awaiting-choice");
    expect(initial.pendingChoice?.artifact.spaceName).toBe("Adoption");

    const collected = collectArtifact(initial);
    expect(collected.boardRun.spaces_collected).toEqual([1]);
    expect(collected.boardRun.fixed_anchor_states[1]).toBe("collected");
    expect(collected.phase).toBe("playing");
  });

  it("publishes versioned, live-update-ready board spaces without chapter gameplay links", () => {
    expect(liveBoard.schemaVersion).toBe(1);
    expect(boardSpaces.length).toBeGreaterThan(12);
    expect(boardSpaces.every((space) => space.live.remoteKey && space.live.revision > 0)).toBe(true);
    expect(JSON.stringify(boardSpaces)).not.toContain("Chapter");
    expect(JSON.stringify(boardSpaces)).not.toContain("INTERVENTION ARG/Chapter");
  });

  it("rolls exactly one Movement Die and one Ripple Die", () => {
    const values = [0.2, 0.99];
    const result = rollDice(() => values.shift() ?? 0);

    expect(result).toEqual({ movementDie: 2, rippleDie: 6, total: 2, lens: "Ripple" });
    expect(Object.keys(result)).toEqual(["movementDie", "rippleDie", "total", "lens"]);
    expect(result.lens).toBe("Ripple");
  });

  it("maps every Ripple Die face to a typed story lens", () => {
    expect([1, 2, 3, 4, 5, 6].map(influenceFor)).toEqual([
      "Memory", "Pressure", "Echo", "Fork", "Intervention", "Ripple",
    ]);
    const low = rollDice(() => 0);
    const high = rollDice(() => 0.999);
    expect(low.movementDie).toBe(1);
    expect(low.rippleDie).toBe(1);
    expect(high.movementDie).toBe(6);
    expect(high.rippleDie).toBe(6);
  });

  it("moves with only the Movement Die and tracks crossed spaces as missed", () => {
    const initial = createRippleGame({ modeId: "experimental", characterId: "mara" });
    const next = advanceWithRoll(initial, roll(5, 3));

    expect(next.position).toBe(5);
    expect(next.phase).toBe("awaiting-choice");
    expect(next.inventory.missed).toHaveLength(4);
    expect(next.pendingChoice?.glassPrompt.user).toContain("Movement Die: 5");
    expect(next.pendingChoice?.glassPrompt.user).toContain("Move: 5 spaces");
    expect(next.pendingChoice?.glassPrompt.user).toContain("Ripple Die: 3 — Echo");
    expect(next.pendingChoice?.glassPrompt.user).toContain("Mara");
    expect(next.boardRun.ripple_lens_history).toEqual(["Echo"]);
  });

  it("recomputes total from the Movement Die and never lets the Ripple Die move the piece", () => {
    const initial = createRippleGame({ modeId: "vague", characterId: "mara" });
    const lowRipple = advanceWithRoll(initial, { ...roll(2, 1), total: 12 });
    const highRipple = advanceWithRoll(initial, { ...roll(2, 6), total: 12 });

    expect(lowRipple.position).toBe(2);
    expect(highRipple.position).toBe(2);
    expect(lowRipple.lastRoll?.total).toBe(2);
    expect(highRipple.lastRoll?.total).toBe(2);
    expect("doubles" in (highRipple.lastRoll ?? {})).toBe(false);
    expect("extraTurnPending" in highRipple).toBe(false);
    expect("extraTurnsEarned" in highRipple).toBe(false);
  });

  it("keeps center-glass output within two to eight words", () => {
    const state = createRippleGame({ modeId: "mystery", characterId: "dev" });
    const prompt = buildRippleRiddlePrompt(state, boardSpaces[3], roll(1, 5));
    const words = prompt.output.trim().split(/\s+/);

    expect(words.length).toBeGreaterThanOrEqual(2);
    expect(words.length).toBeLessThanOrEqual(8);
  });

  it("tracks collected, ignored, and forced artifacts separately", () => {
    const initial = createRippleGame({ modeId: "vague", characterId: "jamal" });
    const first = collectArtifact(advanceWithRoll(initial, roll(1, 1)));
    const secondOffer = advanceWithRoll(first, roll(1, 2));
    const ignored = ignoreArtifact(secondOffer);

    expect(first.inventory.collected).toHaveLength(1);
    expect(ignored.inventory.collected).toHaveLength(1);
    expect(ignored.inventory.ignored).toHaveLength(1);
    expect(ignored.inventory.forced).toHaveLength(1);
    expect(ignored.position).toBe(secondOffer.position - 1);
    expect(ignored.inventory.forced[0].consequence).toBeTruthy();
  });

  it("uses Intervention to ignore without moving back or forcing a space", () => {
    const initial = createRippleGame({ modeId: "vague", characterId: "jamal" });
    const offer = advanceWithRoll(initial, roll(2, 5));
    const ignored = ignoreArtifact(offer);

    expect(ignored.position).toBe(offer.position);
    expect(ignored.inventory.ignored).toHaveLength(1);
    expect(ignored.inventory.forced).toHaveLength(0);
    expect(ignored.boardRun.intervention_turns_used).toBe(1);
  });

  it("uses Ripple to amplify the landed space", () => {
    const initial = createRippleGame({ modeId: "vague", characterId: "mara" });
    const offer = advanceWithRoll(initial, roll(2, 6));

    expect(offer.boardRun.active_lens).toBe("Ripple");
    expect(offer.boardRun.amplified_spaces).toEqual([3]);
    expect(offer.boardRun.lens_effects[0]).toMatchObject({ lens: "Ripple", space: 3 });
  });

  it("creates a complete fiction at the board end rather than a mechanics recap", () => {
    const nearEnd = {
      ...createRippleGame({ modeId: "experimental", characterId: "maren" }),
      position: boardSpaces.length - 3,
    };
    const complete = collectArtifact(advanceWithRoll(nearEnd, roll(3, 5)));

    expect(complete.phase).toBe("complete");
    expect(complete.finalStory?.story.split("\n\n")).toHaveLength(5);
    expect(complete.finalStory?.story).not.toMatch(/\bdice\b|\bturns\b|inventory|clicked/i);
    expect(complete.finalStory?.story).toContain("ordinary kindness");
    expect(complete.finalStory?.prompt.user).toContain("Ripple lens history: Intervention");
    expect(complete.finalStory?.prompt.constraints.join(" ")).toContain("never recap dice");
  });

  it("clamps Teodor / Scott movement to Last Glass and resolves branches by mode", () => {
    const started = collectArtifact(createRippleGame({ modeId: "experimental", characterId: "teodor-scott" }));
    const nearEnd = {
      ...started,
      position: 68,
      boardRun: {
        ...started.boardRun,
        current_position: 69,
        spaces_collected: [1, 2, 3, 70],
        spaces_missed: [6, 7, 71],
      },
    };
    const atLastGlass = advanceWithRoll(nearEnd, roll(6, 5));

    expect(atLastGlass.position).toBe(71);
    expect(atLastGlass.boardRun.last_glass_reached).toBe(true);
    expect(atLastGlass.phase).toBe("awaiting-choice");

    const complete = collectArtifact(atLastGlass);
    const childhood = complete.boardRun.resolved_branch_pairs.find((pair) => pair.group === "childhood_tone");
    const name = complete.boardRun.resolved_branch_pairs.find((pair) => pair.group === "name_relation");
    expect(complete.phase).toBe("complete");
    expect(complete.boardRun.current_position).toBe(72);
    expect(childhood?.kind).toBe("contradiction");
    expect(name?.kind).toBe("mode-resolved");
    expect(name?.hidden).toBe(false);
    expect(complete.boardRun.unresolved_branch_pairs).toContain("name_relation");
    expect(complete.finalStory?.story).toContain("Teodor had been adopted");
    expect(complete.finalStory?.story).toContain("AIFRED began as an audio tool");
    expect(complete.finalStory?.story).not.toMatch(/because the player|dice|inventory/i);
    expect(complete.inventory.collected.some((record) =>
      Boolean(record.storySeed && complete.finalStory?.story.includes(record.storySeed)),
    )).toBe(false);
    expect(complete.finalStory?.prompt.constraints.join(" ")).toContain("do not list raw storySeed fragments");
  });

  it("takes 18–24 turns to cross Teodor / Scott with a representative 1–6 movement cycle", () => {
    let game = collectArtifact(createRippleGame({ modeId: "vague", characterId: "teodor-scott" }));
    let movementDie = 1;

    while (game.phase !== "complete") {
      game = advanceWithRoll(game, roll(movementDie, ((movementDie + 1) % 6) + 1));
      game = collectArtifact(game);
      movementDie = (movementDie % 6) + 1;
    }

    expect(game.turn).toBeGreaterThanOrEqual(18);
    expect(game.turn).toBeLessThanOrEqual(24);
    expect(game.position).toBe(71);
    expect(game.boardRun.spaces_collected.length).toBeGreaterThanOrEqual(18);
  });
});
