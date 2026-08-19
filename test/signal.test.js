var assert = require("assert");
var Graph = require("../js/graph.js");
var SEED = require("../js/seed.js");
var SAFE = require("../js/firesafe.js");
var Signal = require("../js/signal.js");

function pass(name) {
  console.log("ok  " + name);
}

var graph = Graph.createGraph(SEED);
var view = Graph.inspect(graph);
var becker = view.byId["ex-becker"];
var funds = view.byId["ex-funds"];

var liveBecker = Signal.taskSay(becker, true);
assert.strictEqual(liveBecker.a, "Tuesday Becker go/no-go");
assert.ok(/Live bottleneck/.test(liveBecker.b));
assert.ok(/locked until a predecessor/.test(liveBecker.b));
pass("live locked mark keeps name plus bottleneck");

assert.strictEqual(Signal.taskSay(funds, false).a, "Place JointSpace funds");
assert.ok(/place the funds/i.test(Signal.taskSay(funds, false).b));
pass("runnable mark keeps the constructor line");

assert.strictEqual(Signal.lockSay().a, "Locked until a predecessor produces the input.");
assert.strictEqual(Signal.inputSay("JointSpace funds", false).a, "Waiting: JointSpace funds");
assert.strictEqual(Signal.inputSay("JointSpace funds", true).a, "Have: JointSpace funds");
assert.strictEqual(Signal.outputSay("Shared file home", false).a, "Not yet: Shared file home");
assert.strictEqual(Signal.outputSay("Shared file home", true).a, "Exists: Shared file home");
pass("ports say waiting / have / exists / not yet");

assert.strictEqual(Signal.liveSay(view.live).a, "Live: Becker");
assert.ok(/locked/.test(Signal.liveSay(view.live).b));
pass("lamp names the live bottleneck");

assert.strictEqual(Signal.safeKind(SAFE.inNow[0]), "cert");
assert.strictEqual(Signal.safeKind(SAFE.inNow[1]), "minutes");
assert.strictEqual(Signal.safeInSay(SAFE.inNow[0]).a, "In safe: LiquidETH stock certificates 1–4");
assert.strictEqual(Signal.safeInSay(SAFE.inNow[1]).a, "In safe: Minutes");
assert.strictEqual(Signal.nextPrintSay(SAFE.nextPrint).a, "Next print: 2025 personal + 2024 joint");
assert.ok(/W-2/.test(Signal.nextPrintSay(SAFE.nextPrint).b));
assert.ok(/SSA-1099/.test(Signal.nextPrintSay(SAFE.nextPrint).b));
assert.ok(/2024 joint/.test(Signal.nextPrintSay(SAFE.nextPrint).b));
pass("fire-safe marks say in-safe vs the one next print");

console.log("\nAll signal tests passed.");
