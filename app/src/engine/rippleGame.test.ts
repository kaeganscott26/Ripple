import { describe, expect, it } from "vitest";
import { boardSpaces, liveBoard } from "../data/liveBoard";
import { buildRippleRiddlePrompt } from "./aiGlass";
import { advanceWithRoll, collectArtifact, createRippleGame, ignoreArtifact, rollThreeDice } from "./rippleGame";
import type { ThreeDiceRoll } from "./gameTypes";

function roll(a: number, b: number, ripple = 3): ThreeDiceRoll {
  return { movement: [a, b], ripple, total: a + b, doubles: a === b, influence: ripple === 3 ? "warning" : "echo" };
}

describe("canonical Ripple loop", () => {
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
});

