---
name: 🗝️ Intervention Point
description: Document a moment where a loop was interrupted.
title: "Intervention Point: "
labels: ["intervention-point"]
body:
  - type: markdown
    attributes:
      value: |
        An intervention point is a moment where the system could have continued automatically, but something interrupted the pattern.

        Keep it safe. Keep it consent-based. Keep it grounded.

  - type: textarea
    id: loop
    attributes:
      label: OLD LOOP
      description: What pattern was trying to repeat?
      placeholder: "Input → reaction → output → consequence → shame → reset → repeat"
    validations:
      required: true

  - type: textarea
    id: intervention
    attributes:
      label: INTERRUPTION
      description: What sentence, pause, person, boundary, choice, or act of care entered the system?
      placeholder: "What changed the next possible move?"
    validations:
      required: true

  - type: textarea
    id: result
    attributes:
      label: RESULT
      description: What happened after the interruption?
      placeholder: "What did the room do next? What changed inside the observer?"
    validations:
      required: true

  - type: textarea
    id: reflection
    attributes:
      label: REFLECTION
      description: What did this reveal about the room, the architecture, or the feedback loop?
      placeholder: "What do you see now that you did not see before?"
    validations:
      required: false

  - type: checkboxes
    id: boundary
    attributes:
      label: BOUNDARY CHECK
      options:
        - label: I removed private or identifying information.
          required: true
        - label: I am not making another person responsible for my safety, healing, or interpretation.
          required: true
        - label: I understand no framework outranks consent.
          required: true
