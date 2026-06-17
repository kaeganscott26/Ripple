---
name: 🌀 Ripple Event
description: Log a noticed ripple without breaking the room.
title: "Ripple Event: "
labels: ["ripple-event"]
body:
  - type: markdown
    attributes:
      value: |
        Thank you for noticing the room.

        Before posting: remove private details, protect real people, and remember that no metaphor outranks safety.

  - type: textarea
    id: room
    attributes:
      label: ROOM
      description: Where did this happen? Keep it general. Do not include private addresses, workplaces, or identifying details.
      placeholder: "Example: a kitchen, a bus stop, a classroom, a family chat, a work room"
    validations:
      required: true

  - type: textarea
    id: ripple
    attributes:
      label: RIPPLE
      description: What moved through the room?
      placeholder: "A sentence, a mood, a pause, a song, a post, a look, a choice..."
    validations:
      required: true

  - type: textarea
    id: intervention
    attributes:
      label: INTERVENTION POINT
      description: What interrupted the pattern, if anything?
      placeholder: "What changed the next possible move?"
    validations:
      required: false

  - type: textarea
    id: feedback
    attributes:
      label: FEEDBACK
      description: What changed afterward?
      placeholder: "How did the room respond? What did it teach the observer?"
    validations:
      required: true

  - type: checkboxes
    id: boundary
    attributes:
      label: BOUNDARY CHECK
      options:
        - label: I removed private or identifying information.
          required: true
        - label: I am not using this issue to diagnose, expose, target, or shame a real person.
          required: true
        - label: I understand this repo is not therapy, crisis support, religion, or proof that fiction is secretly real.
          required: true
