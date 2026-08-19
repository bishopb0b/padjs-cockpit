(function () {
  var Graph = window.PadjsGraph;
  var SEED = window.PadjsSeed;
  var SAFE = window.PadjsFiresafe;
  var Signal = window.PadjsSignal;
  var graph = Graph.load(null, SEED);
  var selectedEdge = null;
  var mintOpen = false;
  var draft = { name: "", constructor: "", inputs: "", outputs: "" };
  var drag = null;
  var link = null;
  var pinSay = null;
  var sayEl = document.getElementById("say");

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

  function hideSay() {
    if (!sayEl) return;
    sayEl.hidden = true;
    sayEl.textContent = "";
    pinSay = null;
  }

  function fillSay(text) {
    sayEl.textContent = "";
    if (text.a) {
      var one = document.createElement("div");
      one.textContent = text.a;
      sayEl.appendChild(one);
    }
    if (text.b) {
      var two = document.createElement("div");
      two.className = "say2";
      two.textContent = text.b;
      sayEl.appendChild(two);
    }
  }

  function placeSay(x, y) {
    sayEl.hidden = false;
    var maxX = window.innerWidth - 256;
    var maxY = window.innerHeight - 80;
    sayEl.style.left = Math.max(8, Math.min(x + 14, maxX)) + "px";
    sayEl.style.top = Math.max(8, Math.min(y + 14, maxY)) + "px";
  }

  function sayHost(el) {
    return el && el.closest ? el.closest("[data-saya], [data-say]") : null;
  }

  function sayFrom(el) {
    var host = sayHost(el);
    if (!host) return null;
    return {
      a: host.getAttribute("data-saya") || host.getAttribute("data-say") || "",
      b: host.getAttribute("data-sayb") || "",
    };
  }

  function showSay(el, x, y, pin) {
    if ((drag && drag.moved) || link || !sayEl) return;
    var text = sayFrom(el);
    if (!text || (!text.a && !text.b)) return;
    fillSay(text);
    placeSay(x, y);
    if (pin) pinSay = sayHost(el);
  }

  function apply(result) {
    if (!result.ok) {
      draw();
      return;
    }
    graph = result.graph;
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
    var say = Signal.taskSay(viewItem, liveId === task.id);
    node.setAttribute("data-saya", say.a);
    if (say.b) node.setAttribute("data-sayb", say.b);

    node.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".dot, .sq") || mintOpen) return;
      drag = {
        id: task.id,
        dx: event.clientX - task.x,
        dy: event.clientY - task.y,
        x0: event.clientX,
        y0: event.clientY,
        moved: false,
      };
    });

    if (viewItem.locked) {
      node.appendChild(
        el("span", { className: "lock bolt", "data-say": Signal.lockSay().a })
      );
    }
    node.appendChild(el("b", { className: "sigil", text: task.mark || task.name }));

    var ports = el("div", { className: "ports" });
    var ins = el("div", { className: "stack in" });
    task.inputs.forEach(function (inputName) {
      var miss = viewItem.missing.find(function (item) { return item.input === inputName; });
      var row = el("div", { className: "port in" + (miss ? "" : " ok") });
      var waiting = Signal.inputSay(inputName, !miss);
      var dot = el("i", {
        className: "dot",
        "data-port": task.id + ":in:" + inputName,
        "data-say": waiting.a,
      });
      dot.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (link && link.fromId) {
          apply(
            Graph.addEdge(graph, {
              fromId: link.fromId,
              fromOutput: link.fromOutput,
              toId: task.id,
              toInput: inputName,
            })
          );
          link = null;
          return;
        }
        if (miss) apply(Graph.markInputExists(graph, task.id, inputName));
      });
      row.appendChild(dot);
      ins.appendChild(row);
    });
    var outs = el("div", { className: "stack out" });
    task.outputs.forEach(function (outputName) {
      var made = task.produced.indexOf(outputName) !== -1;
      var row = el("div", { className: "port out" + (made ? " ok" : "") });
      var exists = Signal.outputSay(outputName, made);
      row.appendChild(
        el("button", {
          className: "sq" + (made ? " on" : ""),
          type: "button",
          "data-say": exists.a,
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
      var dot = el("i", {
        className: "dot",
        "data-port": task.id + ":out:" + outputName,
        "data-say": exists.a,
      });
      dot.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
        hideSay();
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
      outs.appendChild(row);
    });
    ports.appendChild(ins);
    ports.appendChild(outs);
    node.appendChild(ports);
    return node;
  }

  function draw() {
    hideSay();
    var root = document.getElementById("app");
    root.className = "app";
    var view = Graph.inspect(graph);
    var live = view.live;
    root.replaceChildren();

    var lampClass = "lamp";
    if (live && live.locked) lampClass += " lock";
    else if (live) lampClass += " on";
    var lampText = Signal.liveSay(live);

    root.appendChild(
      el("div", { className: "hud" }, [
        el("i", {
          className: lampClass,
          "data-saya": lampText.a,
          "data-sayb": lampText.b,
        }),
        el("span", { className: "spacer" }),
        selectedEdge
          ? el("button", {
              className: "cut",
              type: "button",
              text: "✂",
              onClick: function () {
                var id = selectedEdge;
                selectedEdge = null;
                apply(Graph.removeEdge(graph, id));
              },
            })
          : null,
        el("button", {
          type: "button",
          text: "+",
          onClick: function () {
            mintOpen = true;
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
    var marks = el("div", { className: "safe-marks" });
    var inBox = el("div", { className: "safe-in" });
    SAFE.inNow.forEach(function (name) {
      var inText = Signal.safeInSay(name);
      inBox.appendChild(
        el("div", {
          className: Signal.safeKind(name),
          "data-saya": inText.a,
        })
      );
    });
    var nextText = Signal.nextPrintSay(SAFE.nextPrint);
    marks.appendChild(inBox);
    marks.appendChild(
      el("div", {
        className: "print",
        "data-saya": nextText.a,
        "data-sayb": nextText.b,
      })
    );
    safe.appendChild(marks);
    stage.appendChild(safe);

    if (mintOpen) {
      var card = el("form", {
        className: "mint-card",
        onSubmit: function (event) {
          event.preventDefault();
          var result = Graph.addTask(graph, draft, { x: 80 + graph.tasks.length * 12, y: 80 + graph.tasks.length * 12 });
          if (!result.ok) {
            draw();
            return;
          }
          graph = result.graph;
          mintOpen = false;
          draft = { name: "", constructor: "", inputs: "", outputs: "" };
          persist();
          draw();
        },
      });
      [
        ["name", "mark"],
        ["constructor", "who"],
        ["inputs", "in"],
        ["outputs", "out"],
      ].forEach(function (pair) {
        var input = el("input", { name: pair[0], placeholder: pair[1], required: pair[0] !== "inputs" });
        input.value = draft[pair[0]];
        input.addEventListener("input", function () {
          draft[pair[0]] = input.value;
        });
        card.appendChild(input);
      });
      card.appendChild(
        el("div", { className: "row" }, [
          el("button", { type: "submit", text: "+" }),
          el("button", {
            className: "ghost",
            type: "button",
            text: "×",
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
  }

  function redrawWires() {
    var stage = document.getElementById("stage");
    if (!stage) return;
    var old = stage.querySelector(".wires");
    if (old) old.remove();
    stage.appendChild(drawWires(stage, Graph.inspect(graph)));
  }

  document.addEventListener("pointerover", function (event) {
    if (pinSay || (drag && drag.moved) || link) return;
    var host = sayHost(event.target);
    if (host) showSay(host, event.clientX, event.clientY, false);
  });

  document.addEventListener("pointerout", function (event) {
    if (pinSay || (drag && drag.moved) || link) return;
    var from = sayHost(event.target);
    if (!from) return;
    var to = event.relatedTarget;
    if (to && sayHost(to)) return;
    hideSay();
  });

  document.addEventListener("pointerdown", function (event) {
    if ((drag && drag.moved) || link) return;
    var host = sayHost(event.target);
    var action = event.target.closest && event.target.closest(".dot, .sq, button, input, .overlay");
    if (host && !action) {
      showSay(host, event.clientX, event.clientY, true);
      return;
    }
    if (!host) hideSay();
  });

  window.addEventListener("pointermove", function (event) {
    if (drag) {
      if (!drag.moved) {
        if (Math.abs(event.clientX - drag.x0) + Math.abs(event.clientY - drag.y0) < 5) return;
        drag.moved = true;
        hideSay();
        var grabbed = document.querySelector('.task[data-id="' + drag.id + '"]');
        if (grabbed) grabbed.classList.add("dragging");
      }
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
      if (drag.moved) persist();
      drag = null;
      var node = document.querySelector(".task.dragging");
      if (node) node.classList.remove("dragging");
    }
  });

  draw();
})();
