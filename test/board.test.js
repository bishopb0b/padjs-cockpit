var assert = require("assert");
var Board = require("../js/board.js");
var SEED = require("../js/seed.js");

function pass(name) {
  console.log("ok  " + name);
}

var board = Board.createBoard(SEED);
assert.strictEqual(Board.counts(board).live, 1, "seed has one live bottleneck");
assert.strictEqual(Board.liveItem(board).id, "ex-becker");
assert.strictEqual(Board.waitingItems(board).length, 2);
assert.ok(board.items.every(function (item) { return item.example; }));
pass("seed examples load with Becker live");

var added = Board.addBottleneck(board, {
  stuck: "Need a signed yes on the lease",
  why: "The landlord has not answered.",
  unstick: "Call and get a yes or a no.",
});
assert.ok(added.ok);
board = added.board;
assert.strictEqual(Board.counts(board).waiting, 3);
assert.strictEqual(Board.liveItem(board).id, "ex-becker", "adding does not steal the live slot");
pass("add keeps the existing live bottleneck");

var empty = Board.createBoard([]);
var first = Board.addBottleneck(empty, {
  stuck: "No live constraint named",
  why: "The board was empty.",
  unstick: "Name the stuck thing.",
});
assert.ok(first.ok);
assert.strictEqual(first.board.liveId, first.id);
pass("first add on an empty board becomes live");

var missing = Board.addBottleneck(board, { stuck: "Only one field" });
assert.ok(!missing.ok);
pass("incomplete add is rejected");

var madeLive = Board.setLive(board, "ex-mac");
assert.ok(madeLive.ok);
board = madeLive.board;
assert.strictEqual(Board.liveItem(board).id, "ex-mac");
assert.strictEqual(Board.counts(board).live, 1);
pass("setLive moves the live mark");

var removed = Board.markRemoved(board, "ex-mac");
assert.ok(removed.ok);
board = removed.board;
assert.strictEqual(Board.liveItem(board), null, "removing the live one leaves the live slot empty");
assert.strictEqual(Board.counts(board).removed, 1);
assert.ok(Board.removedItems(board)[0].removedAt);
pass("markRemoved parks the live item and clears live");

var broughtBack = Board.setLive(board, "ex-mac");
assert.ok(broughtBack.ok);
assert.strictEqual(broughtBack.board.liveId, "ex-mac");
assert.strictEqual(Board.counts(broughtBack.board).removed, 0);
pass("a removed item can be brought back as live");

var store = {
  data: {},
  getItem: function (key) { return this.data[key] || null; },
  setItem: function (key, value) { this.data[key] = value; },
};
Board.save(board, store);
var loaded = Board.load(store, SEED);
assert.strictEqual(loaded.liveId, board.liveId);
assert.strictEqual(loaded.items.length, board.items.length);
pass("save and load round-trip");

var wiped = Board.createBoard([]);
var restored = Board.restoreExamples(wiped, SEED).board;
assert.strictEqual(Board.counts(restored).live, 1);
assert.strictEqual(restored.items.filter(function (item) { return item.example; }).length, 3);
pass("restoreExamples puts the seed rows back");

console.log("\nAll board tests passed.");
