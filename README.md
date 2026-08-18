# PADjs cockpit

This is the first screen of a PADjs “ship of state” tool for Bob Bishop.

It is the **work graph**: construction tasks linked by inputs and outputs. It is not the staff picture. The staff picture is only a tiny legend.

## How Bob opens it

1. Get this folder onto the Mac he is using.
2. Double-click `index.html`, or drag it onto Safari, Chrome, or Firefox.
3. That is the whole install.

The graph remembers his work **in that browser on that Mac**.

## What he sees

A graphic network of **construction tasks**.

A node is a task, not a person and not a folder. It has:

- required **inputs**
- a **constructor** that can still do it
- **outputs** the next task will use as inputs

An edge is a causal link: output of A becomes input of B. Drag an output dot onto an input dot to draw a link. Click a wire, then **Break selected link** to revise it.

If a predecessor has not produced the input, the next task is **locked**. Locked means that constructor cannot run yet. The lock says which predecessor input is missing. That lock is a real constraint.

The glowing node is the **live bottleneck** on a path: the lock or missing input that stops the next constructor.

Rows marked **EXAMPLE** are seeds so the board is not blank. They are not live KIP contents. Real KIP work loads later, when the Mac vault is readable.

## How he flies it

- **Drag a task** to move it.
- **Draw a link** from an output dot to an input dot.
- **Break a link** by clicking the wire, then Break selected link.
- **Add a task** with **+ Task**. It needs a name, a constructor that can still do it, inputs, and outputs. That is a construction task, not a note.
- **Mark a predecessor produced** when that output now exists. Downstream locks open.
- **Mark “this input exists”** when the missing input is in hand. That removes that bottleneck.

## What a bottleneck is

The place a path is stuck: a missing predecessor, a missing input, or a constructor that cannot run yet. Identifying and removing those is the knowledge-growth work.

## The example tasks

These stand in for work Claude tried to signal in vault KIP folders. They are examples, not a dump of the vault.

- Seat Bot file work on one Mac → Shared file home → Model the work as a construction graph.
- Place JointSpace funds, place OPERhythm IP, and productize the dice study → Tuesday Becker go/no-go.

Becker starts locked. It cannot run until those three outputs exist.

## What this is not

- Not a historical timeline of what already happened.
- Not a backlog of things Bob can think of to do.
- Not another KIP folder tree.
- Not the staff-framework picture as the product.
- Not a full Pearl engine or Constructor Theory treatise.

Staff still sit under Bob (You → CoS / Claude / Grok CLI). CoS writes only to vault KIP folders. That frame is the small legend, not the board.

## For someone who wants to check the logic

```
node test/graph.test.js
```

Bob does not need to run that.
