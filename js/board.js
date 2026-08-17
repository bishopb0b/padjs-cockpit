/**
 * Bottleneck board — the only state this first screen keeps.
 * Works in the browser and in Node tests.
 */
(function (root) {
  var STORAGE_KEY = "padjs-cockpit-v1";

  function nowIso() {
    return new Date().toISOString();
  }

  function newId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    var stuck = String(raw.stuck || "").trim();
    var why = String(raw.why || "").trim();
    var unstick = String(raw.unstick || "").trim();
    if (!stuck || !why || !unstick) return null;
    var status = raw.status === "removed" ? "removed" : "waiting";
    return {
      id: String(raw.id || newId("bn")),
      stuck: stuck,
      why: why,
      unstick: unstick,
      status: status,
      example: Boolean(raw.example),
      createdAt: raw.createdAt || nowIso(),
      removedAt: status === "removed" ? raw.removedAt || nowIso() : null,
    };
  }

  function emptyBoard() {
    return { version: 1, liveId: null, items: [] };
  }

  function createBoard(seedItems) {
    var board = emptyBoard();
    (seedItems || []).forEach(function (raw) {
      var item = normalizeItem(raw);
      if (item) board.items.push(item);
    });
    if (seedItems) {
      var liveSeed = seedItems.find(function (item) {
        return item && item.live;
      });
      if (liveSeed && liveSeed.id) board.liveId = liveSeed.id;
    }
    return repair(board);
  }

  function findItem(board, id) {
    return board.items.find(function (item) {
      return item.id === id;
    });
  }

  function repair(board) {
    var next = board && typeof board === "object" ? clone(board) : emptyBoard();
    next.version = 1;
    next.items = (next.items || []).map(normalizeItem).filter(Boolean);
    var live = findItem(next, next.liveId);
    if (!live || live.status === "removed") next.liveId = null;
    return next;
  }

  function counts(board) {
    var live = 0;
    var waiting = 0;
    var removed = 0;
    board.items.forEach(function (item) {
      if (item.status === "removed") removed += 1;
      else if (item.id === board.liveId) live += 1;
      else waiting += 1;
    });
    return { live: live, waiting: waiting, removed: removed, total: board.items.length };
  }

  function liveItem(board) {
    return findItem(board, board.liveId) || null;
  }

  function waitingItems(board) {
    return board.items.filter(function (item) {
      return item.status !== "removed" && item.id !== board.liveId;
    });
  }

  function removedItems(board) {
    return board.items
      .filter(function (item) {
        return item.status === "removed";
      })
      .sort(function (a, b) {
        return String(b.removedAt || "").localeCompare(String(a.removedAt || ""));
      });
  }

  function addBottleneck(board, fields) {
    var item = normalizeItem({
      id: newId("bn"),
      stuck: fields && fields.stuck,
      why: fields && fields.why,
      unstick: fields && fields.unstick,
      status: "waiting",
      example: false,
    });
    if (!item) {
      return { ok: false, error: "Fill in what is stuck, why, and the yes or act that would unstick it." };
    }
    var next = clone(board);
    next.items.unshift(item);
    if (!next.liveId) next.liveId = item.id;
    return { ok: true, board: repair(next), id: item.id };
  }

  function setLive(board, id) {
    var next = clone(board);
    var item = findItem(next, id);
    if (!item) return { ok: false, error: "That bottleneck is gone." };
    if (item.status === "removed") {
      item.status = "waiting";
      item.removedAt = null;
    }
    next.liveId = item.id;
    return { ok: true, board: repair(next) };
  }

  function markRemoved(board, id) {
    var next = clone(board);
    var item = findItem(next, id);
    if (!item) return { ok: false, error: "That bottleneck is gone." };
    item.status = "removed";
    item.removedAt = nowIso();
    if (next.liveId === item.id) next.liveId = null;
    return { ok: true, board: repair(next) };
  }

  function restoreExamples(board, seedItems) {
    var next = clone(board);
    next.items = next.items.filter(function (item) {
      return !item.example;
    });
    (seedItems || []).forEach(function (raw) {
      var item = normalizeItem(raw);
      if (item) next.items.push(item);
    });
    var liveSeed = (seedItems || []).find(function (item) {
      return item && item.live;
    });
    if (liveSeed && liveSeed.id && !next.liveId) next.liveId = liveSeed.id;
    return { ok: true, board: repair(next) };
  }

  function load(storage, seedItems) {
    var store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return createBoard(seedItems);
    try {
      var raw = store.getItem(STORAGE_KEY);
      if (!raw) return createBoard(seedItems);
      return repair(JSON.parse(raw));
    } catch (err) {
      return createBoard(seedItems);
    }
  }

  function save(board, storage) {
    var store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return;
    store.setItem(STORAGE_KEY, JSON.stringify(board));
  }

  var Board = {
    STORAGE_KEY: STORAGE_KEY,
    createBoard: createBoard,
    repair: repair,
    counts: counts,
    liveItem: liveItem,
    waitingItems: waitingItems,
    removedItems: removedItems,
    addBottleneck: addBottleneck,
    setLive: setLive,
    markRemoved: markRemoved,
    restoreExamples: restoreExamples,
    load: load,
    save: save,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Board;
  } else {
    root.PadjsBoard = Board;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
