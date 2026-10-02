# Quickstart

From zero to an agent-designed mockup in about two minutes.

## 1. Start the board

In your project root:

```bash
npx pikaso-design
```

The board opens at `http://localhost:7625` — an empty pan/zoom canvas.

## 2. Ask your agent for a design

In the same workspace, ask any agent that follows the Pikaso skill (IBM Bob, Claude Code, Cursor…):

> Design a landing page for my app.

The agent scouts your codebase for its design language, then writes an HTML
mockup onto the board. A new frame appears in front of you.

## 3. Click anything. Say what's wrong.

- Click any element inside the frame — a comment box opens
- Type your feedback ("make the headline pop") and save
- A numbered pin sticks to the element; the frame label shows `◉ 1 open`

## 4. Let the agent apply it

Back in the terminal:

> Apply the annotations.

The agent reads the pins, edits the mockup HTML, and the frame **reloads live
without a page refresh**. Resolved pins turn grey.

## 5. Lock the draft

When you're happy, hit **Lock** on the board. Pikaso writes
`.pikaso/DESIGN-SPEC.md` — per-frame purpose, token contract, final state and
resolved annotation history — and copies an implementation prompt for your
agent. Now the real feature gets built against a spec, not vibes.

