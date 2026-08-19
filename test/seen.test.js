var assert = require("assert");
var Seen = require("../js/seen.js");

function pass(name) {
  console.log("ok  " + name);
}

function memory() {
  return {
    data: {},
    getItem: function (key) { return this.data[key] || null; },
    setItem: function (key, value) { this.data[key] = value; },
  };
}

var store = memory();
var seen = Seen.load(store);
assert.deepStrictEqual(Seen.leftover(seen), ["drag", "wire", "hover"]);
pass("first visit still has all three ghosts");

var once = Seen.mark(seen, "drag", store);
assert.ok(once.changed);
assert.deepStrictEqual(Seen.leftover(once.seen), ["wire", "hover"]);
assert.deepStrictEqual(Seen.leftover(Seen.load(store)), ["wire", "hover"]);
pass("dragging a block once puts that ghost away");

var again = Seen.mark(once.seen, "drag", store);
assert.ok(!again.changed);
assert.deepStrictEqual(Seen.leftover(again.seen), ["wire", "hover"]);
pass("doing the same move again does not bring the ghost back");

seen = Seen.mark(again.seen, "wire", store).seen;
seen = Seen.mark(seen, "hover", store).seen;
assert.deepStrictEqual(Seen.leftover(seen), []);
pass("after all three moves the ghosts are gone");

console.log("\nAll seen tests passed.");
