# TEODOR / SCOTT SPACE CARDS

## Batch 01 — Origin

_Status: Board Space Cards | Spaces 01–08 | Origin Zone | AI Ending Fuel_

---

## Zone Function

The Origin zone establishes the first condition of the Teodor / Scott board:

A child is carried into a life before he can choose it.

The player does not decide whether adoption happened.

The player decides how Teodor / Scott carries it.

This zone introduces adoption, the first name, the given name, early belonging, and the first identity split.

---

# SPACE 01 — ADOPTION

**Zone:** Origin  
**Type:** Fixed Anchor  
**Reality Layer:** Cultural Layer / Identity Layer / Family Layer  
**Branch Group:** none  
**Opposite Space:** none

## Glass Riddle

The first door opened before your hand could reach it.

## Artifact

Adoption Paper

## Story Seed

Teodor is carried from one life into another before he has words for either. Adults call it rescue, family, paperwork, love, and beginning, but the child only knows that the room has changed.

## Collect Meaning

The character accepts adoption as the first visible door of the story.

Adoption becomes origin, not erasure.

## Ignore Meaning

The character refuses to look directly at the first door.

Adoption remains present, but it begins to ache from underneath the rest of the story.

## Missed Meaning

The origin remains unnamed.

The final story should treat identity as pressure the character feels before he understands where it came from.

## Forced Consequence

The first door returns later as a question:

If this life began before you chose it, what parts of you still belong to the place before the door?

## Boolean Tags

```text
fixed_anchor = true
origin_adoption_exists = true
origin_seen = collect_state
identity_pressure += missed_or_ignored
```

## Ending Influence

This space must appear in every Teodor / Scott ending.

If collected, the ending can describe adoption as a visible origin.

If ignored or missed, the ending should show the character moving through life with a buried first question he cannot fully name.

---

# SPACE 02 — HAPPY CHILDHOOD

**Zone:** Origin  
**Type:** Branch Option  
**Reality Layer:** Memory Layer / Family Layer  
**Branch Group:** childhood_tone  
**Opposite Space:** 03 — Lonely Childhood

## Glass Riddle

Warm rooms do not know they are temporary.

## Artifact

Television Light

## Story Seed

The house is warm before anything knows it will become memory. There is food, noise, carpet, ordinary family life, and the kind of happiness a child trusts because nothing has asked him not to yet.

## Collect Meaning

Warmth becomes part of the character’s foundation.

The final story should allow childhood to contain safety, ordinary love, and real belonging.

## Ignore Meaning

The character distrusts warmth or treats it as unreliable.

Happiness becomes something he remembers only after it has already passed.

## Missed Meaning

A warm childhood possibility passes without being claimed.

If Space 03 is also missed, the board must resolve childhood tone later.

## Forced Consequence

The character finds himself reaching for warmth later but does not trust his own hand when it reaches back.

## Boolean Tags

```text
branch_group = childhood_tone
childhood_happy_collected = true_if_collected
childhood_warmth_weight += collected
childhood_warmth_distorted += ignored_or_forced
```

## Ending Influence

If collected, the ending should include real warmth.

If ignored, the ending should show the character struggling to believe safe rooms are allowed to stay safe.

If missed, the ending may treat childhood warmth as uncertain or reconstructed.

---

# SPACE 03 — LONELY CHILDHOOD

**Zone:** Origin  
**Type:** Branch Option  
**Reality Layer:** Memory Layer / Clinical Reality Layer / Identity Layer  
**Branch Group:** childhood_tone  
**Opposite Space:** 02 — Happy Childhood

## Glass Riddle

A child can be held and still stand far away.

## Artifact

Small Distance

## Story Seed

The child is loved, but part of him watches from somewhere behind his own eyes. He belongs to the house, but still carries a question no one else in the room has to answer.

## Collect Meaning

Loneliness becomes named instead of buried.

The final story should allow the character to be loved and still feel separate.

## Ignore Meaning

The character refuses to name the loneliness.

It becomes behavior later: distance, defensiveness, overthinking, or the need to be understood too urgently.

## Missed Meaning

The loneliness is not seen directly.

If Space 02 is also missed, the board must resolve childhood tone later.

## Forced Consequence

The unnamed distance returns in a future relationship as the fear that love does not mean staying.

## Boolean Tags

```text
branch_group = childhood_tone
childhood_lonely_collected = true_if_collected
identity_distance += collected_or_forced
unseen_loneliness += missed
```

## Ending Influence

If collected, the ending should show loneliness honestly without making it the whole childhood.

If ignored, the ending should let the loneliness leak through later choices.

If both Space 02 and Space 03 are collected, the ending must hold contradiction: warm childhood and lonely childhood both remain true.

---

# SPACE 04 — THE NAME SCOTT

**Zone:** Origin  
**Type:** Fixed Anchor  
**Reality Layer:** Cultural Layer / Family Layer / Identity Layer  
**Branch Group:** none  
**Opposite Space:** none

## Glass Riddle

A name was placed like a roof over rain.

## Artifact

Given Name

## Story Seed

His father gives him the name Scott. The name does not erase Teodor. It gives the new life a shape, a sound, and a place inside the house.

## Collect Meaning

The character accepts Scott as a real name with real love attached to it.

The final story should show the name as something given by presence, not only paperwork.

## Ignore Meaning

The character treats Scott as a cover, a costume, or a legal convenience.

The name still functions, but it no longer feels fully inhabited.

## Missed Meaning

The given name is used by the world but not examined by the character.

The final story should show a man answering to a name before understanding what it cost and what it gave him.

## Forced Consequence

The name Scott returns later through the father layer.

The board asks whether a name given in love can still carry grief after the giver is gone.

## Boolean Tags

```text
fixed_anchor = true
name_scott_exists = true
father_named_scott = true
scott_integrated += collected
scott_as_mask += ignored_or_missed
```

## Ending Influence

This space must influence every ending.

If collected, Scott becomes a name the character can stand inside.

If ignored or missed, Scott becomes a name that works in public but remains unstable underneath.

---

# SPACE 05 — THE FIRST NAME WAITS

**Zone:** Origin  
**Type:** Identity Echo  
**Reality Layer:** Identity Layer / Memory Layer  
**Branch Group:** name_relation_setup  
**Opposite Space:** none

## Glass Riddle

The first name did not disappear. It learned silence.

## Artifact

Silent Name

## Story Seed

Teodor remains underneath Scott. Not angry. Not gone. Waiting. The first name becomes a quiet room inside the second one.

## Collect Meaning

The character notices that Teodor still exists.

The final story should keep both names alive.

## Ignore Meaning

The character hears the first name but turns away from it.

The old name becomes a buried pressure rather than an integrated truth.

## Missed Meaning

The first name remains hidden from the character’s conscious story.

The final ending may reveal it as a late-returning echo.

## Forced Consequence

The first name returns at the wrong time, not as nostalgia, but as a demand:

Do you know who you were before everyone knew who to call you?

## Boolean Tags

```text
teodor_exists = true
first_name_visible += collected
first_name_buried += ignored_or_missed
identity_echo_active = true
```

## Ending Influence

This space should influence whether the ending treats Teodor and Scott as integrated, split, buried, or rediscovered.

---

# SPACE 06 — KEPT TEODOR

**Zone:** Origin  
**Type:** Branch Option  
**Reality Layer:** Identity Layer / Cultural Layer  
**Branch Group:** name_relation  
**Opposite Space:** 07 — Buried Teodor

## Glass Riddle

Two names can stand if the room stops choosing.

## Artifact

Double Name

## Story Seed

The old name is allowed to remain part of the character. Teodor is not treated as a mistake, a secret, or a discarded label. He becomes part of the foundation.

## Collect Meaning

The character carries Teodor forward openly.

The final story should allow both names to exist without forcing one to defeat the other.

## Ignore Meaning

The character almost accepts Teodor, then steps away.

The first name becomes something he respects in theory but avoids in practice.

## Missed Meaning

The chance to integrate Teodor passes.

If Space 07 is also missed, the board may resolve the name relation as unstable or delayed.

## Forced Consequence

A later room calls him by the wrong name, and both names answer.

## Boolean Tags

```text
branch_group = name_relation
kept_teodor = true_if_collected
name_integration += collected
name_conflict += ignored_or_forced
```

## Ending Influence

If collected, the ending should show Teodor and Scott as layered, not enemies.

If ignored, the ending should show the character intellectually knowing the truth while emotionally avoiding it.

---

# SPACE 07 — BURIED TEODOR

**Zone:** Origin  
**Type:** Branch Option  
**Reality Layer:** Identity Layer / Cultural Layer / Clinical Reality Layer  
**Branch Group:** name_relation  
**Opposite Space:** 06 — Kept Teodor

## Glass Riddle

A buried name still learns the floorplan.

## Artifact

Covered Birth Name

## Story Seed

Teodor is covered by Scott because the new life needs a name that fits the new room. The old name does not vanish. It becomes harder to hear.

## Collect Meaning

The character recognizes that Teodor was buried.

This does not mean he approves of the burial. It means he sees it clearly.

## Ignore Meaning

The character refuses to admit the burial happened.

The final story should show identity confusion appearing as irritability, performance, or a need to be seen.

## Missed Meaning

The buried name remains buried.

If Space 06 is also missed, the board may treat name relation as unresolved.

## Forced Consequence

The buried name returns through grief, family, paperwork, or a story that will not let the character keep pretending he began at Scott.

## Boolean Tags

```text
branch_group = name_relation
buried_teodor = true_if_collected
name_suppression_seen += collected
name_suppression_denied += ignored
identity_return_pressure += forced_or_missed
```

## Ending Influence

If collected, the ending should show the character understanding that burial happened.

If ignored or missed, the ending should let Teodor return indirectly, as pressure beneath the Scott identity.

If Space 06 and Space 07 are both collected, the ending should show an honest contradiction: Teodor was both kept and buried in different rooms.

---

# SPACE 08 — THE FIRST TRANSLATION

**Zone:** Origin  
**Type:** Origin Consequence / Zone Gate  
**Reality Layer:** Cultural Layer / Family Layer / Language Layer / Identity Layer  
**Branch Group:** none  
**Opposite Space:** none

## Glass Riddle

A child is not only received. A child is translated.

## Artifact

Translated Child

## Story Seed

Before Teodor can explain himself, other people explain him. They mean love. They mean rescue. They mean family. But every explanation changes the child slightly, because being brought into a new life also means being interpreted by it.

## Collect Meaning

The character accepts that translation shaped him.

The final story should show him learning to separate love from simplification.

## Ignore Meaning

The character refuses to see how much of his early life was interpreted for him.

The final story should show him reacting strongly when others explain him too quickly.

## Missed Meaning

Translation remains invisible.

The character may spend the ending believing his identity confusion came from nowhere.

## Forced Consequence

Someone tells his story for him later, and the board makes him feel the old translation happen again.

## Boolean Tags

```text
origin_zone_complete = true
translation_theme_active = true
explained_by_others += collected_or_forced
resists_external_definition += ignored
identity_context_missing += missed
```

## Ending Influence

This space closes the Origin zone.

If collected, the ending should show the character understanding that love and translation can happen together.

If ignored or missed, the ending should show him fighting later definitions without fully knowing why.

---

# Origin Zone Resolution Rules

## Childhood Tone

```text
IF Space 02 collected AND Space 03 not collected:
    childhood_tone = warm_fragile

IF Space 03 collected AND Space 02 not collected:
    childhood_tone = loved_but_lonely

IF Space 02 collected AND Space 03 collected:
    childhood_tone = warm_and_lonely

IF Space 02 missed AND Space 03 missed:
    childhood_tone = unresolved
```

## Name Relation

```text
IF Space 06 collected AND Space 07 not collected:
    name_relation = integrated_dual_name

IF Space 07 collected AND Space 06 not collected:
    name_relation = buried_origin_seen

IF Space 06 collected AND Space 07 collected:
    name_relation = kept_and_buried

IF Space 06 missed AND Space 07 missed:
    name_relation = unresolved_name_pressure
```

## Origin Pressure

```text
IF Space 01 ignored OR Space 04 ignored:
    origin_pressure += 2

IF Space 05 missed:
    identity_echo_active = hidden

IF Space 08 forced:
    external_definition_wound = active
```

---

# AI Ending Fuel Summary

The Origin zone gives the ending generator these possible materials:

```text
adoption as visible origin
adoption as buried pressure
happy childhood
lonely childhood
warm and lonely childhood
Scott as given name
Scott as mask
Teodor as kept name
Teodor as buried name
identity as translation
love mixed with simplification
a child explained before he could explain himself
```

The final story should never treat the Origin zone as optional.

Even missed Origin spaces must affect the ending as absence, pressure, or unresolved identity.