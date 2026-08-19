(function () {
  var Graph = window.PadjsGraph;
  var SEED = window.PadjsSeed;
  var SAFE = window.PadjsFiresafe;
  var graph = Graph.load(null, SEED);
  var selectedEdge = null;
  var mintOpen = false;
  var formError = "";
  var draft = { name: "", constructor: "", inputs: "", outputs: "" };
  var drag = null;
  var link = null;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "className") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      else if (attrs[key] === false || attrs[key] == null) return;
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (typeof child === "string") node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    });
    return node;
  }

  function persist() {
    Graph.save(graph);
  }

  function apply(result) {
    if (!result.ok) {
      formError = result.error || "";
      draw();
      return;
    }
    graph = result.graph;
    formError = "";
    persist();
    draw();
  }

  function portCenter(taskId, kind, name) {
    var node = document.querySelector('[data-port="' + taskId + ":" + kind + ":" + name + '"]');
    var stage = document.getElementById("stage");
    if (!node || !stage) return null;
    var a = node.getBoundingClientRect();
    var b = stage.getBoundingClientRect();
    return {
      x: a.left - b.left + stage.scrollLeft + a.width / 2,
      y: a.top - b.top + stage.scrollTop + a.height / 2,
    };
  }

  function curve(a, b) {
    var mid = (b.x - a.x) / 2;
    return "M " + a.x + " " + a.y + " C " + (a.x + Math.max(40, mid)) + " " + a.y + ", " + (b.x - Math.max(40, mid)) + " " + b.y + ", " + b.x + " " + b.y;
  }

  function drawWires(stage, view) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "wires");
    var width = Math.max(stage.scrollWidth, stage.clientWidth);
    var height = Math.max(stage.scrollHeight, stage.clientHeight, 900);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.width = width + "px";
    svg.style.height = height + "px";

    graph.edges.forEach(function (edge) {
      var from = portCenter(edge.fromId, "out", edge.fromOutput);
      var to = portCenter(edge.toId, "in", edge.toInput);
      if (!from || !to) return;
      var toView = view.byId[edge.toId];
      var locked = toView && toView.missing.some(function (item) { return item.edgeId === edge.id; });
      var liveHit = view.live && (view.live.id === edge.toId || view.live.id === edge.fromId);
      var d = curve(from, to);
      var hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hit.setAttribute("d", d);
      hit.setAttribute("class", "hit");
      hit.style.pointerEvents = "stroke";
      hit.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
        selectedEdge = edge.id;
        draw();
      });
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute(
        "class",
        (locked ? "locked" : "") + (liveHit ? " live" : "") + (selectedEdge === edge.id ? " selected" : "")
      );
      svg.appendChild(hit);
      svg.appendChild(path);
    });

    if (link && link.from && link.to) {
      var rubber = document.createElementNS("http://www.w3.org/2000/svg", "path");
      rubber.setAttribute("d", curve(link.from, link.to));
      rubber.setAttribute("class", "live");
      svg.appendChild(rubber);
    }
    return svg;
  }

  function waitText(missing) {
    if (!missing.length) return "";
    return missing
      .map(function (item) {
        if (item.hasPredecessor) return "Locked: waiting on “" + item.fromOutput + "” from “" + item.fromName + "”.";
        return "Locked: missing input “" + item.input + "” — no predecessor yet.";
      })
      .join(" ");
  }

  function renderTask(viewItem, liveId) {
    var task = viewItem.task;
    var node = el("article", {
      className:
        "task" +
        (viewItem.locked ? " locked" : viewItem.done ? " done" : " runnable") +
        (liveId === task.id ? " live" : ""),
      style: "left:" + task.x + "px;top:" + task.y + "px",
      "data-id": task.id,
    });
    node.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".dot, .act") || mintOpen) return;
      drag = {
        id: task.id,
        dx: event.clientX - task.x,
        dy: event.clientY - task.y,
      };
      node.classList.add("dragging");
    });

    var tags = el("div", { className: "tags" });
    if (task.example) tags.appendChild(el("span", { className: "tag example", text: "Example" }));
    if (liveId === task.id) tags.appendChild(el("span", { className: "tag live", text: "Live bottleneck" }));
    if (viewItem.locked) tags.appendChild(el("span", { className: "tag lock", text: "Locked" }));
    else if (viewItem.done) tags.appendChild(el("span", { className: "tag done", text: "Produced" }));
    else tags.appendChild(el("span", { className: "tag ready", text: "Constructor can run" }));
    node.appendChild(tags);
    node.appendChild(el("h3", { text: task.name }));
    node.appendChild(el("p", { className: "ctor", text: "Constructor: " + task.constructor }));

    var ports = el("div", { className: "ports" });
    task.inputs.forEach(function (inputName) {
      var miss = viewItem.missing.find(function (item) { return item.input === inputName; });
      var row = el("div", { className: "port in" + (miss ? "" : " ok") });
      var dot = el("i", {
        className: "dot",
        "data-port": task.id + ":in:" + inputName,
        title: "Drop an output here",
      });
      dot.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (!link || !link.fromId) return;
        apply(
          Graph.addEdge(graph, {
            fromId: link.fromId,
            fromOutput: link.fromOutput,
            toId: task.id,
            toInput: inputName,
          })
        );
        link = null;
      });
      row.appendChild(dot);
      row.appendChild(document.createTextNode(inputName));
      if (miss) {
        row.appendChild(
          el("button", {
            className: "act",
            type: "button",
            text: "Exists",
            title: "Mark this missing input as now existing",
            onClick: function (event) {
              event.stopPropagation();
              apply(Graph.markInputExists(graph, task.id, inputName));
            },
          })
        );
      }
      ports.appendChild(row);
    });
    task.outputs.forEach(function (outputName) {
      var made = task.produced.indexOf(outputName) !== -1;
      var row = el("div", { className: "port out" + (made ? " ok" : "") });
      row.appendChild(
        el("button", {
          className: "act go",
          type: "button",
          text: made ? "Unmake" : "Exists",
          title: made ? "This output is not produced yet" : "Predecessor produced this output",
          onClick: function (event) {
            event.stopPropagation();
            apply(
              made
                ? Graph.markUnproduced(graph, task.id, outputName)
                : Graph.markProduced(graph, task.id, outputName)
            );
          },
        })
      );
      row.appendChild(document.createTextNode(outputName));
      var dot = el("i", {
        className: "dot",
        "data-port": task.id + ":out:" + outputName,
        title: "Drag to an input",
      });
      dot.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
        var stage = document.getElementById("stage");
        var box = stage.getBoundingClientRect();
        link = {
          fromId: task.id,
          fromOutput: outputName,
          from: portCenter(task.id, "out", outputName),
          to: {
            x: event.clientX - box.left + stage.scrollLeft,
            y: event.clientY - box.top + stage.scrollTop,
          },
        };
        selectedEdge = null;
        draw();
      });
      row.appendChild(dot);
      ports.appendChild(row);
    });
    node.appendChild(ports);

    if (viewItem.locked) {
      node.appendChild(el("p", { className: "wait", text: waitText(viewItem.missing) }));
    }

    return node;
  }

  function draw() {
    var root = document.getElementById("app");
    root.className = "app";
    var view = Graph.inspect(graph);
    var live = view.live;
    root.replaceChildren();

    root.appendChild(
      el("div", { className: "hud" }, [
        el("b", { text: "PADjs" }),
        el("span", { text: "Work graph" }),
        el("span", { text: "Task · input · output · lock" }),
        el("span", {
          className: "live-readout",
          text: live
            ? live.locked
              ? "Bottleneck: " + live.task.name + " is locked"
              : "Bottleneck: " + live.task.name + " can run"
            : "No live bottleneck",
        }),
        selectedEdge
          ? el("button", {
              type: "button",
              text: "Break link",
              onClick: function () {
                var id = selectedEdge;
                selectedEdge = null;
                apply(Graph.removeEdge(graph, id));
              },
            })
          : null,
        el("button", {
          type: "button",
          text: "+ Task",
          onClick: function () {
            mintOpen = true;
            formError = "";
            draw();
          },
        }),
      ])
    );

    var stage = el("section", { className: "stage", id: "stage" });
    stage.addEventListener("pointerdown", function (event) {
      if (event.target !== stage && !event.target.classList.contains("extent")) return;
      link = null;
      selectedEdge = null;
      draw();
    });
    stage.appendChild(el("div", { className: "extent", "aria-hidden": "true" }));
    view.tasks.forEach(function (item) {
      stage.appendChild(renderTask(item, live && live.id));
    });
    var safe = el("aside", { className: "safe", onPointerDown: function (event) { event.stopPropagation(); } });
    safe.appendChild(el("div", { className: "safe-latch", "aria-hidden": "true" }));
    safe.appendChild(el("h2", { text: "Fire safe" }));
    var now = el("div", { className: "safe-bay in" }, [el("div", { className: "safe-kicker", text: "In now" })]);
    SAFE.inNow.forEach(function (item) {
      now.appendChild(el("div", { className: "safe-item checked", text: item }));
    });
    safe.appendChild(now);
    safe.appendChild(
      el("div", { className: "safe-bay next" }, [
        el("div", { className: "safe-kicker", text: "Next print" }),
        el("div", { className: "safe-ticket", text: SAFE.nextPrint.name }),
        el("div", { className: "safe-ticket-sub", text: SAFE.nextPrint.contains }),
      ])
    );
    safe.appendChild(
      el("div", { className: "owners" }, [
        el("div", { className: "owner robs" }, [
          el("b", { text: "ROBS" }),
          el("span", { text: SAFE.owners.robs }),
        ]),
        el("div", { className: "owner taxes" }, [
          el("b", { text: "Taxes" }),
          el("span", { text: SAFE.owners.taxes }),
        ]),
      ])
    );
    stage.appendChild(safe);
    stage.appendChild(
      el("div", { className: "legend" }, [
        el("b", { text: "Frame, not the work" }),
        document.createTextNode(" You → CoS / Claude / Grok CLI. CoS writes only KIP folders. Staff output: report, proposed do, proposed edit."),
      ])
    );
    if (mintOpen) {
      var card = el("form", {
        className: "mint-card",
        onSubmit: function (event) {
          event.preventDefault();
          var result = Graph.addTask(graph, draft, { x: 80 + graph.tasks.length * 12, y: 80 + graph.tasks.length * 12 });
          if (!result.ok) {
            formError = result.error;
            draw();
            return;
          }
          graph = result.graph;
          mintOpen = false;
          draft = { name: "", constructor: "", inputs: "", outputs: "" };
          formError = "";
          persist();
          draw();
        },
      });
      card.appendChild(el("h2", { text: "Add a construction task" }));
      [
        ["name", "What construction is this?"],
        ["constructor", "Who or what can still do it?"],
        ["inputs", "Required inputs, comma separated"],
        ["outputs", "Outputs the next task will use"],
      ].forEach(function (pair) {
        var input = el("input", { name: pair[0], placeholder: pair[1], required: pair[0] !== "inputs" });
        input.value = draft[pair[0]];
        input.addEventListener("input", function () {
          draft[pair[0]] = input.value;
        });
        card.appendChild(input);
      });
      card.appendChild(el("p", { className: "err", text: formError }));
      card.appendChild(
        el("div", { className: "row" }, [
          el("button", { type: "submit", text: "Place on the graph" }),
          el("button", {
            className: "ghost",
            type: "button",
            text: "Cancel",
            onClick: function () {
              mintOpen = false;
              draw();
            },
          }),
        ])
      );
      stage.appendChild(el("div", { className: "overlay" }, [card]));
    }
    root.appendChild(stage);
    stage.appendChild(drawWires(stage, view));

    var hint = "Drag a task to move it. Click an output dot, then click an input dot to link. Click a wire, then Break link.";
    if (live && live.locked) {
      hint = live.task.name + " cannot run yet. " + waitText(live.missing);
    } else if (live) {
      hint = live.task.name + " is the live bottleneck: the constructor can run. Mark its output produced when the input exists.";
    }
    if (link && link.fromId) hint = "Linking “" + link.fromOutput + "”. Click an input dot, or click the map to cancel.";
    if (selectedEdge) hint = "Link selected. Press Break link in the top bar, or click the map to keep it.";
    root.appendChild(el("div", { className: "hint", text: hint }));
  }

  function redrawWires() {
    var stage = document.getElementById("stage");
    if (!stage) return;
    var old = stage.querySelector(".wires");
    if (old) old.remove();
    stage.appendChild(drawWires(stage, Graph.inspect(graph)));
  }

  window.addEventListener("pointermove", function (event) {
    if (drag) {
      var moved = Graph.moveTask(graph, drag.id, event.clientX - drag.dx, event.clientY - drag.dy);
      if (moved.ok) {
        graph = moved.graph;
        var node = document.querySelector('.task[data-id="' + drag.id + '"]');
        var task = Graph.taskById(graph, drag.id);
        if (node && task) {
          node.style.left = task.x + "px";
          node.style.top = task.y + "px";
        }
        redrawWires();
      }
      return;
    }
    if (!link) return;
    var stage = document.getElementById("stage");
    if (!stage) return;
    var box = stage.getBoundingClientRect();
    link.to = {
      x: event.clientX - box.left + stage.scrollLeft,
      y: event.clientY - box.top + stage.scrollTop,
    };
    redrawWires();
  });

  window.addEventListener("pointerup", function () {
    if (drag) {
      persist();
      drag = null;
      var node = document.querySelector(".task.dragging");
      if (node) node.classList.remove("dragging");
    }
  });

  draw();
})();
