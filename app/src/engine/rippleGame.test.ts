import { describe, expect, it } from "vitest";
import { boardSpaces, liveBoard } from "../data/liveBoard";
import { boardForCharacter, teodorScottBoard } from "../data/boards";
import { buildRippleRiddlePrompt } from "./aiGlass";
import { advanceWithRoll, collectArtifact, createRippleGame, ignoreArtifact, rollThreeDice } from "./rippleGame";
import type { ThreeDiceRoll } from "./gameTypes";

function roll(a: number, b: number, ripple = 3): ThreeDiceRoll {
  return { movement: [a, b], ripple, total: a + b, doubles: a === b, influence: ripple === 3 ? "warning" : "echo" };
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

  it("rolls exactly three dice and identifies doubles", () => {
    const values = [0.2, 0.2, 0.99];
    const result = rollThreeDice(() => values.shift() ?? 0);

    expect(result.movement).toEqual([2, 2]);
    expect(result.ripple).toBe(6);
    expect(result.total).toBe(4);
    expect(result.doubles).toBe(true);
    expect(result.influence).toBe("threshold");
  });

  it("moves with two dice, uses the third for the glass, and tracks crossed spaces as missed", () => {
    const initial = createRippleGame({ modeId: "experimental", characterId: "mara" });
    const next = advanceWithRoll(initial, roll(2, 3, 3));

    expect(next.position).toBe(5);
    expect(next.phase).toBe("awaiting-choice");
    expect(next.inventory.missed).toHaveLength(4);
    expect(next.pendingChoice?.glassPrompt.user).toContain("ripple die 3 (warning)");
    expect(next.pendingChoice?.glassPrompt.user).toContain("Mara");
  });

  it("keeps center-glass output within two to eight words", () => {
    const state = createRippleGame({ modeId: "mystery", characterId: "dev" });
    const prompt = buildRippleRiddlePrompt(state, boardSpaces[3], roll(1, 2, 5));
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
    expect(first.extraTurnsEarned).toBe(1);
    expect(ignored.inventory.collected).toHaveLength(1);
    expect(ignored.inventory.ignored).toHaveLength(1);
    expect(ignored.inventory.forced).toHaveLength(1);
    expect(ignored.position).toBe(secondOffer.position - 1);
    expect(ignored.inventory.forced[0].consequence).toBeTruthy();
  });

  it("creates a complete fiction at the board end rather than a mechanics recap", () => {
    const nearEnd = {
      ...createRippleGame({ modeId: "experimental", characterId: "maren" }),
      position: boardSpaces.length - 3,
    };
    const complete = collectArtifact(advanceWithRoll(nearEnd, roll(1, 2, 5)));

    expect(complete.phase).toBe("complete");
    expect(complete.finalStory?.story.split("\n\n")).toHaveLength(5);
    expect(complete.finalStory?.story).not.toMatch(/\bdice\b|\bturns\b|inventory|clicked/i);
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
    const atLastGlass = advanceWithRoll(nearEnd, roll(6, 6, 5));

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
  });
});
