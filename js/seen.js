/**
 * First-visit ghosts. Each kind vanishes after he does it once.
 */
(function (root) {
  var KEY = "padjs-seen-v1";
  var KINDS = ["drag", "wire", "hover"];

  function empty() {
    return { drag: false, wire: false, hover: false };
  }

  function storeOf(storage) {
    return storage || (typeof localStorage !== "undefined" ? localStorage : null);
  }

  function load(storage) {
    var store = storeOf(storage);
    if (!store) return empty();
    try {
      var raw = JSON.parse(store.getItem(KEY) || "{}") || {};
      return {
        drag: Boolean(raw.drag),
        wire: Boolean(raw.wire),
        hover: Boolean(raw.hover),
      };
    } catch (err) {
      return empty();
    }
  }

  function save(seen, storage) {
    var store = storeOf(storage);
    if (!store) return;
    store.setItem(KEY, JSON.stringify({
      drag: Boolean(seen.drag),
      wire: Boolean(seen.wire),
      hover: Boolean(seen.hover),
    }));
  }

  function mark(seen, kind, storage) {
    var next = {
      drag: Boolean(seen && seen.drag),
      wire: Boolean(seen && seen.wire),
      hover: Boolean(seen && seen.hover),
    };
    if (KINDS.indexOf(kind) === -1 || next[kind]) {
      return { changed: false, seen: next };
    }
    next[kind] = true;
    save(next, storage);
    return { changed: true, seen: next };
  }

  function leftover(seen) {
    return KINDS.filter(function (kind) {
      return !(seen && seen[kind]);
    });
  }

  var Seen = {
    KEY: KEY,
    KINDS: KINDS,
    load: load,
    save: save,
    mark: mark,
    leftover: leftover,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Seen;
  } else {
    root.PadjsSeen = Seen;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
