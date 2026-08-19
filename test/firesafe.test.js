var assert = require("assert");
var SAFE = require("../js/firesafe.js");

function pass(name) {
  console.log("ok  " + name);
}

assert.deepStrictEqual(SAFE.inNow, [
  "LiquidETH stock certificates 1–4",
  "Minutes",
]);
pass("in the safe now is only certificates 1–4 and minutes");

assert.strictEqual(SAFE.nextPrint.name, "2025 personal + 2024 joint");
assert.ok(/W-2/.test(SAFE.nextPrint.contains));
assert.ok(/1099/.test(SAFE.nextPrint.contains));
assert.ok(/SSA-1099/.test(SAFE.nextPrint.contains));
assert.ok(/2024 joint/.test(SAFE.nextPrint.contains));
pass("next print is one named personal/joint packet");

assert.strictEqual(Object.keys(SAFE).indexOf("printQueue"), -1);
assert.ok(!SAFE.laterPackets);
pass("the rest of the print queue is not on this glance");

assert.ok(/Carly/.test(SAFE.owners.robs));
assert.ok(/5500/.test(SAFE.owners.robs));
assert.ok(/Plan Sponsor Link/.test(SAFE.owners.robs));
assert.ok(/Benetrends/.test(SAFE.owners.robs));
assert.ok(/1040/.test(SAFE.owners.taxes));
assert.ok(/MI-1040/.test(SAFE.owners.taxes));
assert.ok(/1120/.test(SAFE.owners.taxes));
assert.ok(/Xero/.test(SAFE.owners.taxes));
assert.ok(/6765/.test(SAFE.owners.taxes));
pass("ownership reminder is ROBS vs Taxes only");

console.log("\nAll fire-safe tests passed.");
