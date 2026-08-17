# PADjs cockpit

This is the first screen of a PADjs “ship of state” tool for Bob Bishop.

It is a **bottleneck board**. It is not a note system, not Obsidian’s graph, and not a rebuild of KIP. It does not invent mail, calendar, or live metrics.

## How Bob opens it

1. Get this folder onto the Mac he is using (clone the repo, or download the files).
2. Open `index.html` in a browser.
   - Easiest: Finder → double-click `index.html`.
   - Or drag the file onto Safari, Chrome, or Firefox.
3. That is the whole install. There is no login, no settings maze, and no folder tree to click through.

The board remembers what he typed **in that browser on that Mac**. If he switches from the Air to the Mini, this copy of the page will not automatically follow him. That is one of the example bottlenecks.

## What a bottleneck is

A bottleneck is the thing that is stuck. Until it moves, other work waits.

Each row answers three questions:

- **What is stuck**
- **Why it is stuck**
- **What yes or act would unstick it**

Identifying and removing bottlenecks is the knowledge-growth work. The page is meant to be flyable in one glance: one live constraint, the rest waiting, and a strip of what has already been caused.

## How to use the board

- **Add a bottleneck.** Fill the three boxes on the right and press **Add bottleneck**. If nothing is live yet, the new one becomes live.
- **Mark the live one.** Press **Make this the live one**. Only one bottleneck is live at a time. That is the constraint the ship is working.
- **Mark one removed / caused.** When the yes or act has happened, press **Mark removed / caused**. It leaves the live/waiting board and sits in **Removed / caused** so the work is visible, not deleted into a folder.

If he clears the example rows, a **Put the example rows back** button appears at the bottom.

## You, then staff

Staff sit under Bob. They are never his peers.

```
You
 ├── Grok Bot CoS
 ├── Claude
 └── Grok CLI
```

- **CoS** writes only to vault KIP folders.
- Other vault paths are Bob-only.
- Agent output belongs in one of three bins: **report**, **proposed do**, or **proposed edit**.

Those bins are a reminder on this first screen. They are not a second note system.

## The example rows

The first three rows are labeled **EXAMPLE**. They are seeds so the board is not blank. They are not live data.

- Grok Bot file work is one Mac at a time (Air vs Mini).
- The cockpit screen did not exist (this repo is the start).
- Tuesday Becker go/no-go still needs JointSpace funds, OPERhythm IP, and dice-study productization.

## What this is not

- Not a full Pearl DAG or Constructor Theory engine.
- Not KIP itself.
- Not a place to dump notes.

Later screens can grow. This pull request is only the first glanceable board.

## For someone who wants to check the logic

From this folder:

```
node test/board.test.js
```

That checks add, live, and removed. Bob does not need to run it.
