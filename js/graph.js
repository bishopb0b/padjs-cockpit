/**
 * Construction-task graph — the work, not the staff frame.
 * A node is a task with inputs, a constructor, and outputs.
 * An edge is output of A becoming input of B. A lock is a missing predecessor.
 */
(function (root) {
  var STORAGE_KEY = "padjs-cockpit-v3";

  function nowIso() {
    return new Date().toISOString();
  }

  function newId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function listOf(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) { return String(item || "").trim(); }).filter(Boolean);
    }
    return String(value || "")
      .split(",")
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function normalizeTask(raw) {
    if (!raw || typeof raw !== "object") return null;
    var name = String(raw.name || "").trim();
    var constructor = String(raw.constructor || "").trim();
    var inputs = listOf(raw.inputs);
    var outputs = listOf(raw.outputs);
    if (!name || !constructor || !outputs.length) return null;
    var produced = listOf(raw.produced).filter(function (item) {
      return outputs.indexOf(item) !== -1;
    });
    var satisfiedInputs = listOf(raw.satisfiedInputs).filter(function (item) {
      return inputs.indexOf(item) !== -1;
    });
    return {
      id: String(raw.id || newId("task")),
      name: name,
      constructor: constructor,
      inputs: inputs,
      outputs: outputs,
      produced: produced,
      satisfiedInputs: satisfiedInputs,
      x: Number(raw.x) || 40,
      y: Number(raw.y) || 40,
      example: Boolean(raw.example),
      createdAt: raw.createdAt || nowIso(),
    };
  }

  function normalizeEdge(raw) {
    if (!raw || typeof raw !== "object") return null;
    var fromId = String(raw.fromId || "").trim();
    var toId = String(raw.toId || "").trim();
    var fromOutput = String(raw.fromOutput || "").trim();
    var toInput = String(raw.toInput || "").trim();
    if (!fromId || !toId || !fromOutput || !toInput || fromId === toId) return null;
    return {
      id: String(raw.id || newId("edge")),
      fromId: fromId,
      fromOutput: fromOutput,
      toId: toId,
      toInput: toInput,
    };
  }

  function emptyGraph() {
    return { version: 3, tasks: [], edges: [] };
  }

  function createGraph(seed) {
    var graph = emptyGraph();
    ((seed && seed.tasks) || []).forEach(function (raw) {
      var task = normalizeTask(raw);
      if (task) graph.tasks.push(task);
    });
    ((seed && seed.edges) || []).forEach(function (raw) {
      var edge = normalizeEdge(raw);
      if (edge) graph.edges.push(edge);
    });
    return repair(graph);
  }

  function taskById(graph, id) {
    return graph.tasks.find(function (task) {
      return task.id === id;
    }) || null;
  }

  function edgeById(graph, id) {
    return graph.edges.find(function (edge) {
      return edge.id === id;
    }) || null;
  }

  function repair(graph) {
    var next = graph && typeof graph === "object" ? clone(graph) : emptyGraph();
    next.version = 3;
    next.tasks = (next.tasks || []).map(normalizeTask).filter(Boolean);
    var ids = {};
    next.tasks.forEach(function (task) { ids[task.id] = task; });
    next.edges = (next.edges || []).map(normalizeEdge).filter(function (edge) {
      if (!edge) return false;
      var from = ids[edge.fromId];
      var to = ids[edge.toId];
      return from && to && from.outputs.indexOf(edge.fromOutput) !== -1 && to.inputs.indexOf(edge.toInput) !== -1;
    });
    return next;
  }

  function incoming(graph, taskId, inputName) {
    return graph.edges.find(function (edge) {
      return edge.toId === taskId && edge.toInput === inputName;
    }) || null;
  }

  function outgoing(graph, taskId) {
    return graph.edges.filter(function (edge) {
      return edge.fromId === taskId;
    });
  }

  function isOutputProduced(task, outputName) {
    return task.produced.indexOf(outputName) !== -1;
  }

  function isInputSatisfied(graph, task, inputName) {
    if (task.satisfiedInputs.indexOf(inputName) !== -1) return true;
    var edge = incoming(graph, task.id, inputName);
    if (!edge) return false;
    var from = taskById(graph, edge.fromId);
    return Boolean(from && isOutputProduced(from, edge.fromOutput));
  }

  function missingInputs(graph, task) {
    return task.inputs
      .filter(function (inputName) {
        return !isInputSatisfied(graph, task, inputName);
      })
      .map(function (inputName) {
        var edge = incoming(graph, task.id, inputName);
        var from = edge ? taskById(graph, edge.fromId) : null;
        return {
          input: inputName,
          hasPredecessor: Boolean(edge),
          fromId: edge ? edge.fromId : null,
          fromName: from ? from.name : null,
          fromOutput: edge ? edge.fromOutput : null,
          edgeId: edge ? edge.id : null,
        };
      });
  }

  function isDone(task) {
    return task.outputs.length > 0 && task.outputs.every(function (outputName) {
      return isOutputProduced(task, outputName);
    });
  }

  function inspectTask(graph, task) {
    var missing = missingInputs(graph, task);
    var done = isDone(task);
    return {
      id: task.id,
      task: task,
      missing: missing,
      locked: missing.length > 0,
      done: done,
      runnable: missing.length === 0 && !done,
    };
  }

  function inspect(graph) {
    var views = graph.tasks.map(function (task) {
      return inspectTask(graph, task);
    });
    var byId = {};
    views.forEach(function (view) { byId[view.id] = view; });
    var live = pickBottleneck(graph, views);
    return { tasks: views, byId: byId, live: live };
  }

  function pickBottleneck(graph, views) {
    var locked = views.filter(function (view) { return view.locked && !view.done; });
    var runnable = views.filter(function (view) { return view.runnable; });
    function downstreamLocks(view) {
      return outgoing(graph, view.id).filter(function (edge) {
        var other = views.find(function (item) { return item.id === edge.toId; });
        return other && other.locked;
      }).length;
    }
    if (locked.length) {
      var sinks = locked.filter(function (view) {
        return outgoing(graph, view.id).length === 0;
      });
      var pool = sinks.length ? sinks : locked;
      pool.sort(function (a, b) {
        return b.missing.length - a.missing.length;
      });
      return pool[0];
    }
    if (runnable.length) {
      runnable.sort(function (a, b) {
        return downstreamLocks(b) - downstreamLocks(a);
      });
      return runnable[0];
    }
    return null;
  }

  function addTask(graph, fields, at) {
    var task = normalizeTask({
      name: fields && fields.name,
      constructor: fields && fields.constructor,
      inputs: fields && fields.inputs,
      outputs: fields && fields.outputs,
      x: at && at.x,
      y: at && at.y,
    });
    if (!task) {
      return { ok: false, error: "A task needs a name, a constructor that can still do it, and at least one output." };
    }
    var next = clone(graph);
    next.tasks.push(task);
    return { ok: true, graph: repair(next), id: task.id };
  }

  function moveTask(graph, id, x, y) {
    var next = clone(graph);
    var task = taskById(next, id);
    if (!task) return { ok: false, error: "That task is gone." };
    task.x = Math.max(16, Number(x) || 16);
    task.y = Math.max(16, Number(y) || 16);
    return { ok: true, graph: next };
  }

  function addEdge(graph, fields) {
    var edge = normalizeEdge(fields);
    if (!edge) return { ok: false, error: "A link needs an output and an input on two different tasks." };
    var from = taskById(graph, edge.fromId);
    var to = taskById(graph, edge.toId);
    if (!from || !to) return { ok: false, error: "Both tasks must exist." };
    if (from.outputs.indexOf(edge.fromOutput) === -1) return { ok: false, error: "That output is not on the first task." };
    if (to.inputs.indexOf(edge.toInput) === -1) return { ok: false, error: "That input is not on the next task." };
    var taken = incoming(graph, edge.toId, edge.toInput);
    var next = clone(graph);
    if (taken) {
      next.edges = next.edges.filter(function (item) { return item.id !== taken.id; });
    }
    var exists = next.edges.some(function (item) {
      return item.fromId === edge.fromId && item.fromOutput === edge.fromOutput && item.toId === edge.toId && item.toInput === edge.toInput;
    });
    if (!exists) next.edges.push(edge);
    return { ok: true, graph: repair(next), id: edge.id };
  }

  function removeEdge(graph, id) {
    var next = clone(graph);
    var before = next.edges.length;
    next.edges = next.edges.filter(function (edge) { return edge.id !== id; });
    if (next.edges.length === before) return { ok: false, error: "That link is gone." };
    return { ok: true, graph: next };
  }

  function markProduced(graph, taskId, outputName) {
    var next = clone(graph);
    var task = taskById(next, taskId);
    if (!task) return { ok: false, error: "That task is gone." };
    if (task.outputs.indexOf(outputName) === -1) return { ok: false, error: "That output is not on this task." };
    if (task.produced.indexOf(outputName) === -1) task.produced.push(outputName);
    return { ok: true, graph: next };
  }

  function markUnproduced(graph, taskId, outputName) {
    var next = clone(graph);
    var task = taskById(next, taskId);
    if (!task) return { ok: false, error: "That task is gone." };
    task.produced = task.produced.filter(function (item) { return item !== outputName; });
    return { ok: true, graph: next };
  }

  function markInputExists(graph, taskId, inputName) {
    var next = clone(graph);
    var task = taskById(next, taskId);
    if (!task) return { ok: false, error: "That task is gone." };
    if (task.inputs.indexOf(inputName) === -1) return { ok: false, error: "That input is not on this task." };
    if (task.satisfiedInputs.indexOf(inputName) === -1) task.satisfiedInputs.push(inputName);
    return { ok: true, graph: next };
  }

  function load(storage, seed) {
    var store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return createGraph(seed);
    try {
      var raw = store.getItem(STORAGE_KEY);
      if (!raw) return createGraph(seed);
      return repair(JSON.parse(raw));
    } catch (err) {
      return createGraph(seed);
    }
  }

  function save(graph, storage) {
    var store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return;
    store.setItem(STORAGE_KEY, JSON.stringify(graph));
  }

  var Graph = {
    STORAGE_KEY: STORAGE_KEY,
    createGraph: createGraph,
    repair: repair,
    inspect: inspect,
    inspectTask: inspectTask,
    missingInputs: missingInputs,
    isInputSatisfied: isInputSatisfied,
    isDone: isDone,
    addTask: addTask,
    moveTask: moveTask,
    addEdge: addEdge,
    removeEdge: removeEdge,
    markProduced: markProduced,
    markUnproduced: markUnproduced,
    markInputExists: markInputExists,
    taskById: taskById,
    edgeById: edgeById,
    incoming: incoming,
    load: load,
    save: save,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Graph;
  } else {
    root.PadjsGraph = Graph;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
