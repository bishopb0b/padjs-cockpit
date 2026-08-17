(function () {
  var Board = window.PadjsBoard;
  var SEED = window.PadjsSeed;
  var board = Board.load(null, SEED);
  var heldId = null;
  var mintOpen = false;
  var formError = "";
  var draft = { stuck: "", why: "", unstick: "" };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "className") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      else if (attrs[key] === false || attrs[key] == null) return;
      else if (attrs[key] === true) node.setAttribute(key, "");
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (typeof child === "string") node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    });
    return node;
  }

  function persist() {
    Board.save(board);
  }

  function labelOf(item) {
    return item.label || item.stuck;
  }

  function yesOf(item) {
    return item.yes || item.unstick;
  }

  function heldItem() {
    return board.items.find(function (item) {
      return item.id === heldId;
    }) || null;
  }

  function apply(result) {
    if (!result.ok) return;
    board = result.board;
    heldId = null;
    persist();
    draw();
  }

  function chip(item, kind) {
    return el(
      "button",
      {
        className:
          "chip" +
          (item.example ? " example" : "") +
          (kind === "caused" ? " caused-chip" : "") +
          (heldId === item.id ? " held" : ""),
        type: "button",
        title: item.stuck + " — " + item.why,
        onClick: function (event) {
          event.stopPropagation();
          heldId = heldId === item.id ? null : item.id;
          draw();
        },
      },
      [el("b", { text: labelOf(item) })]
    );
  }

  function drawWires(live) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "wires");
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    var lines = [
      [500, 140, 220, 300],
      [500, 140, 500, 300],
      [500, 140, 780, 300],
      [220, 360, 220, 500],
      [500, 360, 500, 500],
      [780, 360, 780, 500],
      [220, 580, 500, 700],
      [500, 580, 500, 700],
      [780, 580, 500, 700],
    ];
    lines.forEach(function (pts, index) {
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", pts[0]);
      line.setAttribute("y1", pts[1]);
      line.setAttribute("x2", pts[2]);
      line.setAttribute("y2", pts[3]);
      if (index > 5 && live) line.setAttribute("class", "to-live");
      svg.appendChild(line);
    });
    return svg;
  }

  function seatLive() {
    var item = heldItem();
    if (!item) return;
    apply(Board.setLive(board, item.id));
  }

  function sendCaused() {
    var item = heldItem();
    if (!item) return;
    apply(Board.markRemoved(board, item.id));
  }

  function draw() {
    var root = document.getElementById("app");
    root.className = "app";
    root.replaceChildren();
    var live = Board.liveItem(board);
    var waiting = Board.waitingItems(board);
    var removed = Board.removedItems(board);
    var holding = heldItem();

    root.appendChild(
      el("div", { className: "brand" }, [
        el("b", { text: "PADjs" }),
        el("span", { text: "Ship of state" }),
        el("span", { text: "You · staff · stores · live block" }),
      ])
    );

    var hold = el("aside", { className: "rail hold" }, [el("div", { className: "rail-title", text: "Hold" })]);
    waiting.forEach(function (item) {
      hold.appendChild(chip(item, "hold"));
    });
    hold.appendChild(
      el(
        "button",
        {
          className: "mint",
          type: "button",
          onClick: function () {
            mintOpen = true;
            formError = "";
            draw();
          },
        },
        [el("b", { text: "+ New token" })]
      )
    );

    var map = el("section", { className: "map", onClick: function () { heldId = null; draw(); } });
    map.appendChild(drawWires(live));
    map.appendChild(el("div", { className: "node you" }, [el("b", { text: "You" })]));
    map.appendChild(
      el("div", { className: "node staff cos" }, [el("b", { text: "Grok Bot CoS" }), el("small", { text: "KIP folders only" })])
    );
    map.appendChild(
      el("div", { className: "node staff claude" }, [el("b", { text: "Claude" }), el("small", { text: "Staff, not a peer" })])
    );
    map.appendChild(
      el("div", { className: "node staff cli" }, [el("b", { text: "Grok CLI" }), el("small", { text: "Staff, not a peer" })])
    );
    map.appendChild(
      el("div", { className: "node store kip" }, [el("b", { text: "KIP vault" }), el("small", { text: "CoS writes here" })])
    );
    map.appendChild(
      el("div", { className: "node store bins" }, [
        el("b", { text: "Staff bins" }),
        el("div", { className: "bins-row" }, [
          el("span", { className: "bin", text: "Report" }),
          el("span", { className: "bin", text: "Do" }),
          el("span", { className: "bin", text: "Edit" }),
        ]),
      ])
    );
    map.appendChild(
      el("div", { className: "node store bob" }, [el("b", { text: "Bob-only vault" }), el("small", { text: "Not staff" })])
    );

    var liveBtn = el("button", {
      className: "node live" + (live ? "" : " empty") + (holding && holding.status !== "removed" ? " drop" : ""),
      type: "button",
      onClick: function (event) {
        event.stopPropagation();
        if (holding && holding.id !== (live && live.id)) seatLive();
        else if (live) {
          heldId = live.id;
          draw();
        }
      },
    });
    if (live) {
      liveBtn.appendChild(el("span", { className: "tag", text: live.example ? "Live · Example" : "Live block" }));
      liveBtn.appendChild(el("span", { className: "name", text: labelOf(live) }));
      liveBtn.appendChild(el("span", { className: "yes", text: yesOf(live) }));
    } else {
      liveBtn.appendChild(el("span", { className: "tag", text: "Empty socket" }));
      liveBtn.appendChild(el("span", { className: "name", text: "Seat a token" }));
      liveBtn.appendChild(el("span", { className: "yes", text: "Pick one from Hold" }));
    }
    map.appendChild(liveBtn);

    if (mintOpen) {
      var card = el("form", {
        className: "mint-card",
        onSubmit: function (event) {
          event.preventDefault();
          var result = Board.addBottleneck(board, draft);
          if (!result.ok) {
            formError = result.error;
            draw();
            return;
          }
          board = result.board;
          heldId = result.id;
          mintOpen = false;
          formError = "";
          draft = { stuck: "", why: "", unstick: "" };
          persist();
          draw();
        },
        onClick: function (event) {
          event.stopPropagation();
        },
      });
      card.appendChild(el("h2", { text: "Mint a token" }));
      ["stuck", "why", "unstick"].forEach(function (name) {
        var input = el("input", {
          name: name,
          required: true,
          placeholder: name === "stuck" ? "What is stuck" : name === "why" ? "Why" : "Yes or act that unsticks it",
        });
        input.value = draft[name];
        input.addEventListener("input", function () {
          draft[name] = input.value;
        });
        card.appendChild(input);
      });
      card.appendChild(el("p", { className: "err", text: formError }));
      card.appendChild(
        el("div", { className: "row" }, [
          el("button", { type: "submit", text: "Drop onto the map" }),
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
      map.appendChild(el("div", { className: "overlay" }, [card]));
    }

    var caused = el("aside", { className: "rail caused" }, [el("div", { className: "rail-title", text: "Caused" })]);
    var bay = el("div", {
      className: "drop-bay" + (holding ? " hot" : ""),
      onClick: function (event) {
        event.stopPropagation();
        sendCaused();
      },
    });
    if (!removed.length) {
      bay.appendChild(el("div", { className: "rail-title", text: holding ? "Drop here to clear" : "Empty" }));
    }
    caused.appendChild(bay);
    removed.forEach(function (item) {
      caused.appendChild(chip(item, "caused"));
    });

    var hint = "The glowing block is the live bottleneck. Pick a token, then click the block or the Caused bay.";
    if (holding && holding.status === "removed") {
      hint = "Token in hand. Click the live block to put it back, or click the map to set it down.";
    } else if (holding && live && holding.id === live.id) {
      hint = "Live token in hand. Click Caused to mark it removed.";
    } else if (holding) {
      hint = "Token in hand. Click the live block to seat it, or Caused to clear it.";
    } else if (!live) {
      hint = "No live block. Pick a Hold token and click the empty socket.";
    }

    root.appendChild(hold);
    root.appendChild(map);
    root.appendChild(caused);
    root.appendChild(el("div", { className: "hint", text: hint }));
  }

  draw();
})();
