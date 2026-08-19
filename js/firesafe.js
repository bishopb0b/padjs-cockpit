/**
 * Fire-safe paper on the work-graph IO.
 * Only what Bob must see at a glance. Later packets stay off this card.
 */
(function (root) {
  var FIRESAFE = {
    inNow: ["LiquidETH stock certificates 1–4", "Minutes"],
    nextPrint: {
      name: "2025 personal + 2024 joint",
      contains: "W-2, 1099s, SSA-1099, and the 2024 joint return",
    },
    owners: {
      robs: "Carly · 5500 · Plan Sponsor Link · Benetrends YE",
      taxes: "1040 · MI-1040 · 1120 · Xero · Gusto 6765",
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = FIRESAFE;
  } else {
    root.PadjsFiresafe = FIRESAFE;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
