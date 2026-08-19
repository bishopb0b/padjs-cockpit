var assert = require("assert");
var Graph = require("../js/graph.js");
var SEED = require("../js/seed.js");

function pass(name) {
  console.log("ok  " + name);
}

var graph = Graph.createGraph(SEED);
var view = Graph.inspect(graph);
assert.strictEqual(graph.tasks.length, 6);
assert.strictEqual(graph.edges.length, 4);
assert.ok(view.byId["ex-becker"].locked, "Becker is locked until predecessors produce");
assert.ok(view.byId["ex-work-graph"].locked, "work graph is locked on file home");
assert.ok(view.byId["ex-funds"].runnable);
assert.ok(view.byId["ex-mac-home"].runnable);
assert.strictEqual(view.live.id, "ex-becker", "live bottleneck is the locked sink");
assert.strictEqual(view.byId["ex-becker"].missing.length, 3);
assert.ok(view.byId["ex-becker"].missing.every(function (item) { return item.hasPredecessor; }));
pass("seed is a locked Becker path plus a locked cockpit path");

var produced = Graph.markProduced(graph, "ex-funds", "JointSpace funds");
assert.ok(produced.ok);
graph = produced.graph;
view = Graph.inspect(graph);
assert.strictEqual(view.byId["ex-becker"].missing.length, 2);
assert.ok(view.byId["ex-becker"].locked);
pass("producing funds leaves Becker locked on IP and dice");

graph = Graph.markProduced(graph, "ex-ip", "OPERhythm IP").graph;
graph = Graph.markProduced(graph, "ex-dice", "Dice-study product").graph;
view = Graph.inspect(graph);
assert.ok(!view.byId["ex-becker"].locked);
assert.ok(view.byId["ex-becker"].runnable);
assert.strictEqual(view.live.id, "ex-work-graph", "after Becker unlocks, remaining lock is the live bottleneck");
pass("all three predecessor outputs unlock Becker");

var exists = Graph.markInputExists(Graph.createGraph(SEED), "ex-work-graph", "Shared file home");
assert.ok(exists.ok);
assert.ok(!Graph.inspect(exists.graph).byId["ex-work-graph"].locked);
pass("marking the missing input as existing unlocks without inventing KIP");

var added = Graph.addTask(graph, {
  name: "Write the go packet",
  constructor: "Bob can still write it",
  inputs: "Go or no-go",
  outputs: "Go packet",
}, { x: 800, y: 360 });
assert.ok(added.ok);
graph = added.graph;
var linked = Graph.addEdge(graph, {
  fromId: "ex-becker",
  fromOutput: "Go or no-go",
  toId: added.id,
  toInput: "Go or no-go",
});
assert.ok(linked.ok);
graph = linked.graph;
assert.ok(Graph.inspect(graph).byId[added.id].locked, "new successor is locked until Becker produces");
pass("add a task and draw a causal link");

var broken = Graph.removeEdge(graph, linked.id);
assert.ok(broken.ok);
assert.ok(Graph.inspect(broken.graph).byId[added.id].locked, "no predecessor means the required input is still missing");
pass("breaking a link leaves the input missing");

var moved = Graph.moveTask(graph, "ex-becker", 500, 200);
assert.ok(moved.ok);
assert.strictEqual(moved.graph.tasks.find(function (task) { return task.id === "ex-becker"; }).x, 500);
pass("tasks can be moved");

var bad = Graph.addTask(graph, { name: "Note to self" });
assert.ok(!bad.ok);
pass("a note is not a construction task");

var store = {
  data: {},
  getItem: function (key) { return this.data[key] || null; },
  setItem: function (key, value) { this.data[key] = value; },
};
Graph.save(graph, store);
var loaded = Graph.load(store, SEED);
assert.strictEqual(loaded.tasks.length, graph.tasks.length);
assert.strictEqual(loaded.edges.length, graph.edges.length);
pass("save and load round-trip");

console.log("\nAll graph tests passed.");
