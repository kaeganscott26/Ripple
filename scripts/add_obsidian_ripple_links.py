#!/usr/bin/env python3
"""
Add/refresh Obsidian graph links at the bottom of every INTERVENTION chapter.

Why this exists:
- Obsidian graph view does not recognize [{Chapter 01}] as a note link.
- Obsidian graph view DOES recognize [[Chapter 01]] style wikilinks.
- This script adds a stable Ripple Links block to each chapter so the repo graph
  can visually express the theory: order, layer current, echo, artifact, return.

Run from the repo root:

    python3 scripts/add_obsidian_ripple_links.py

Then commit the updated chapter files:

    git add "INTERVENTION ARG" scripts/add_obsidian_ripple_links.py
    git commit -m "docs: refresh chapter ripple links"
    git push origin main
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTER_DIR = ROOT / "INTERVENTION ARG"

START = "<!-- RIPPLE_LINKS_START -->"
END = "<!-- RIPPLE_LINKS_END -->"

CORE_LINKS = [
    "[[ORDER]]",
    "[[CHAPTER_RIPPLE_MAP]]",
    "[[LAYER_INDEX]]",
    "[[THEORY_LAYER]]",
]

SAFETY_LINKS = [
    "[[MENTAL_HEALTH_DISCLAIMER]]",
    "[[BOUNDARIES]]",
]

# These are meaning-based, not random. Previous/next links create the reading
# sequence. Layer links expose the mechanism under the chapter. Echoes create
# the sideways interference pattern. The epilogue returns to the Layer Index
# so the repo becomes a loop rather than a dead end.
LINK_MAP = {
    "Prologue.md": {
        "prev": "[[README]]",
        "next": "[[Chapter 01]]",
        "layers": ["[[HOW_TO_PLAY]]", "[[THEORY_LAYER]]", "[[BOUNDARIES]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]"],
        "role": "doorway before the first room",
    },
    "Chapter 01.md": {
        "prev": "[[Prologue]]",
        "next": "[[Chapter 02]]",
        "layers": ["[[CULTURAL_LAYER]]", "[[POWER_GOVERNANCE_LAYER]]", "[[MEDIA_COMMUNICATION_LAYER]]", "[[CLINICAL_REALITY_LAYER]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]", "[[ARTIFACT_020_THE_SPLIT_LAYER]]"],
        "role": "first ripple / adoption / origin architecture",
    },
    "Chapter 02.md": {
        "prev": "[[Chapter 01]]",
        "next": "[[Chapter 03]]",
        "layers": ["[[CLINICAL_REALITY_LAYER]]", "[[MENTAL_HEALTH_DISCLAIMER]]", "[[BOUNDARIES]]"],
        "echoes": ["[[ARTIFACT_021_THE_IGNORED_LAYER]]"],
        "role": "trigger / gap between impulse and action",
    },
    "Chapter 03.md": {
        "prev": "[[Chapter 02]]",
        "next": "[[Chapter 04]]",
        "layers": ["[[THEORY_LAYER]]", "[[GEOMETRY_AS_CONSEQUENCE]]", "[[CLINICAL_REALITY_LAYER]]"],
        "echoes": ["[[ARTIFACT_020_THE_SPLIT_LAYER]]"],
        "role": "room architecture / behavior made sensible by environment",
    },
    "Chapter 04.md": {
        "prev": "[[Chapter 03]]",
        "next": "[[Chapter 05]]",
        "layers": ["[[THEORY_LAYER]]", "[[UNEXPLAINED_LAYER]]", "[[BOUNDARIES]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]", "[[ARTIFACT_020_THE_SPLIT_LAYER]]"],
        "role": "missed intervention / hidden fork",
    },
    "Chapter 05.md": {
        "prev": "[[Chapter 04]]",
        "next": "[[Chapter 06]]",
        "layers": ["[[MEDIA_COMMUNICATION_LAYER]]", "[[CULTURAL_LAYER]]", "[[COMMUNITY_RIPPLES]]"],
        "echoes": ["[[THEORY_LAYER]]"],
        "role": "shared reality / social rendering layer",
    },
    "Chapter 06.md": {
        "prev": "[[Chapter 05]]",
        "next": "[[Chapter 07]]",
        "layers": ["[[UNEXPLAINED_LAYER]]", "[[CLINICAL_REALITY_LAYER]]", "[[BOUNDARIES]]"],
        "echoes": ["[[ARTIFACT_021_THE_IGNORED_LAYER]]"],
        "role": "false world / danger of mistaking pattern for command",
    },
    "Chapter 07.md": {
        "prev": "[[Chapter 06]]",
        "next": "[[Chapter 08]]",
        "layers": ["[[THEORY_LAYER]]", "[[GEOMETRY_AS_CONSEQUENCE]]", "[[MEDIA_COMMUNICATION_LAYER]]"],
        "echoes": ["[[chapter_07_read_aloud_failure]]"],
        "role": "observer / broadcast / perception as public architecture",
    },
    "Chapter 08.md": {
        "prev": "[[Chapter 07]]",
        "next": "[[Chapter 09]]",
        "layers": ["[[DREAM_LAYER]]", "[[CLINICAL_REALITY_LAYER]]", "[[CULTURAL_LAYER]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]", "[[ARTIFACT_020_THE_SPLIT_LAYER]]", "[[DREAM_RIPPLE_MAP]]"],
        "role": "0826 / fatherhood / signal aimed at love",
    },
    "Chapter 09.md": {
        "prev": "[[Chapter 08]]",
        "next": "[[Chapter 10]]",
        "layers": ["[[SOFTWARE_SYSTEMS_LAYER]]", "[[MEDIA_COMMUNICATION_LAYER]]", "[[COMMUNITY_RIPPLES]]"],
        "echoes": ["[[ARTIFACT_020_THE_SPLIT_LAYER]]"],
        "role": "kitchen / work pressure / rooms changing people",
    },
    "Chapter 10.md": {
        "prev": "[[Chapter 09]]",
        "next": "[[Chapter 11]]",
        "layers": ["[[GEOMETRY_AS_CONSEQUENCE]]", "[[SOFTWARE_SYSTEMS_LAYER]]", "[[THEORY_LAYER]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]"],
        "role": "signal / music / uploaded consequence",
    },
    "Chapter 11.md": {
        "prev": "[[Chapter 10]]",
        "next": "[[Chapter 12]]",
        "layers": ["[[CLINICAL_REALITY_LAYER]]", "[[THEORY_LAYER]]", "[[BOUNDARIES]]"],
        "echoes": ["[[ARTIFACT_020_THE_SPLIT_LAYER]]"],
        "role": "loop / repeated pattern / intervention before repetition",
    },
    "Chapter 12.md": {
        "prev": "[[Chapter 11]]",
        "next": "[[Chapter 13]]",
        "layers": ["[[GEOMETRY_AS_CONSEQUENCE]]", "[[UNEXPLAINED_LAYER]]", "[[THEORY_LAYER]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]"],
        "role": "door / threshold / choice as passage",
    },
    "Chapter 13.md": {
        "prev": "[[Chapter 12]]",
        "next": "[[Chapter 14]]",
        "layers": ["[[COMMUNITY_RIPPLES]]", "[[MEDIA_COMMUNICATION_LAYER]]", "[[CULTURAL_LAYER]]"],
        "echoes": ["[[CHANGELOG]]"],
        "role": "echo / phrase becoming public signal",
    },
    "Chapter 14.md": {
        "prev": "[[Chapter 13]]",
        "next": "[[Chapter 15]]",
        "layers": ["[[NATURAL_LAYER]]", "[[GEOMETRY_AS_CONSEQUENCE]]", "[[THEORY_LAYER]]"],
        "echoes": ["[[NATURAL_RIPPLE_MAP]]", "[[CHANGELOG]]"],
        "role": "cosmic room / expansion / first ripple scaled outward",
    },
    "Chapter 15.md": {
        "prev": "[[Chapter 14]]",
        "next": "[[Chapter 16]]",
        "layers": ["[[NATURAL_LAYER]]", "[[WEATHER_LAYER]]", "[[ANTHROPOCENE_LAYER]]", "[[GEOMETRY_AS_CONSEQUENCE]]"],
        "echoes": ["[[ARTIFACT_021_THE_IGNORED_LAYER]]"],
        "role": "boulder / weight / consequence made visible",
    },
    "Chapter 16.md": {
        "prev": "[[Chapter 15]]",
        "next": "[[Chapter 17]]",
        "layers": ["[[MEDIA_COMMUNICATION_LAYER]]", "[[DREAM_LAYER]]", "[[CLINICAL_REALITY_LAYER]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]", "[[ARTIFACT_021_THE_IGNORED_LAYER]]", "[[DREAM_RIPPLE_MAP]]"],
        "role": "morning after the signal / the thing under the thing",
    },
    "Chapter 17.md": {
        "prev": "[[Chapter 16]]",
        "next": "[[EPILOGUE]]",
        "layers": ["[[CULTURAL_LAYER]]", "[[CLINICAL_REALITY_LAYER]]", "[[POWER_GOVERNANCE_LAYER]]", "[[THEORY_LAYER]]"],
        "echoes": ["[[ARTIFACT_017_CURATOR'S_LAYER]]", "[[ARTIFACT_020_THE_SPLIT_LAYER]]", "[[GEOMETRY_AS_CONSEQUENCE]]"],
        "role": "return current / Teodor / inheritance and accountability",
    },
    "EPILOGUE.md": {
        "prev": "[[Chapter 17]]",
        "next": "[[LAYER_INDEX]]",
        "layers": ["[[THEORY_LAYER]]", "[[CHAPTER_RIPPLE_MAP]]", "[[GEOMETRY_AS_CONSEQUENCE]]", "[[BOUNDARIES]]"],
        "echoes": ["[[README]]", "[[ORDER]]"],
        "role": "final cadence / return to reader control",
    },
}


def format_links(filename: str, data: dict[str, object]) -> str:
    layers = data.get("layers", [])
    echoes = data.get("echoes", [])
    if not isinstance(layers, list):
        layers = []
    if not isinstance(echoes, list):
        echoes = []

    lines = [
        "",
        "---",
        START,
        "",
        "## 🌀 Ripple Links",
        "",
        f"- **Room function:** {data['role']}",
        f"- **Previous room:** {data['prev']}",
        f"- **Next room:** {data['next']}",
        f"- **Canon path:** {' · '.join(CORE_LINKS)}",
        f"- **Safety frame:** {' · '.join(SAFETY_LINKS)}",
    ]

    if layers:
        lines.append(f"- **Layer currents:** {' · '.join(layers)}")
    if echoes:
        lines.append(f"- **Echo / artifact links:** {' · '.join(echoes)}")
    if filename == "Chapter 17.md":
        lines.append("- **Return current:** [[Chapter 17]] → [[EPILOGUE]] → [[LAYER_INDEX]] → [[README]]")
    if filename == "EPILOGUE.md":
        lines.append("- **Return current:** [[EPILOGUE]] → [[LAYER_INDEX]] → [[README]] → [[Chapter 01]]")

    lines += [
        "",
        "> The graph is not decoration. It is the theory drawing its own path back to the reader.",
        "",
        END,
        "",
    ]
    return "\n".join(lines)


def replace_or_append(content: str, block: str) -> str:
    if START in content and END in content:
        before = content.split(START, 1)[0].rstrip()
        after = content.split(END, 1)[1].lstrip()
        return f"{before}\n{block}{after}"
    return content.rstrip() + "\n" + block


def main() -> None:
    changed = []
    for filename, data in LINK_MAP.items():
        path = CHAPTER_DIR / filename
        if not path.exists():
            print(f"SKIP missing: {path}")
            continue
        original = path.read_text(encoding="utf-8")
        block = format_links(filename, data)
        updated = replace_or_append(original, block)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed.append(filename)

    if changed:
        print("Updated Ripple Links in:")
        for name in changed:
            print(f"- {name}")
    else:
        print("No chapter link blocks changed.")


if __name__ == "__main__":
    main()
