(function () {
  var Board = window.PadjsBoard;
  var SEED = window.PadjsSeed;
  var board = Board.load(null, SEED);
  var formError = "";
  var draft = { stuck: "", why: "", unstick: "" };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "className") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function persist() {
    Board.save(board);
  }

  function renderCard(item, opts) {
    var isLive = opts && opts.live;
    var card = el("article", { className: "card" + (isLive ? " live" : item.status === "removed" ? " removed" : "") });
    var badges = el("div", { className: "badges" });
    if (item.example) badges.appendChild(el("span", { className: "badge example", text: "Example" }));
    badges.appendChild(
      el("span", {
        className: "badge " + (isLive ? "live" : item.status === "removed" ? "removed" : "waiting"),
        text: isLive ? "Live" : item.status === "removed" ? "Removed / caused" : "Waiting",
      })
    );
    card.appendChild(badges);
    card.appendChild(el("h3", { text: "What is stuck" }));
    card.appendChild(el("p", { className: "stuck", text: item.stuck }));
    card.appendChild(el("h3", { text: "Why" }));
    card.appendChild(el("p", { className: "why", text: item.why }));
    card.appendChild(el("h3", { text: "Yes or act that unsticks it" }));
    card.appendChild(el("p", { className: "unstick", text: item.unstick }));

    var actions = el("div", { className: "actions" });
    if (item.status !== "removed" && !isLive) {
      actions.appendChild(
        el("button", {
          className: "secondary",
          type: "button",
          text: "Make this the live one",
          onClick: function () {
            var result = Board.setLive(board, item.id);
            if (result.ok) {
              board = result.board;
              persist();
              draw();
            }
          },
        })
      );
    }
    if (item.status !== "removed") {
      actions.appendChild(
        el("button", {
          className: "danger",
          type: "button",
          text: "Mark removed / caused",
          onClick: function () {
            var result = Board.markRemoved(board, item.id);
            if (result.ok) {
              board = result.board;
              persist();
              draw();
            }
          },
        })
      );
    } else {
      actions.appendChild(
        el("button", {
          className: "secondary",
          type: "button",
          text: "Put this back as the live one",
          onClick: function () {
            var result = Board.setLive(board, item.id);
            if (result.ok) {
              board = result.board;
              persist();
              draw();
            }
          },
        })
      );
    }
    card.appendChild(actions);
    return card;
  }

  function draw() {
    var root = document.getElementById("app");
    root.replaceChildren();
    var tally = Board.counts(board);
    var live = Board.liveItem(board);
    var waiting = Board.waitingItems(board);
    var removed = Board.removedItems(board);

    var mast = el("header", { className: "masthead" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "PADjs · Ship of state" }),
        el("h1", { text: "Bottleneck board" }),
        el("p", {
          className: "lede",
          text: "What is stuck, why it is stuck, and the yes or act that would unstick it. One live constraint at a time.",
        }),
      ]),
      el("div", { className: "gauges" }, [
        el("div", { className: "gauge live" }, [el("b", { text: String(tally.live) }), el("span", { text: "Live" })]),
        el("div", { className: "gauge waiting" }, [el("b", { text: String(tally.waiting) }), el("span", { text: "Waiting" })]),
        el("div", { className: "gauge removed" }, [el("b", { text: String(tally.removed) }), el("span", { text: "Caused" })]),
      ]),
    ]);

    var liveBox = el("section", { className: "panel live-panel" }, [
      el("h2", { text: "Live bottleneck" }),
      live
        ? renderCard(live, { live: true })
        : el("p", {
            className: "empty",
            text: "Nothing is marked live. Add a bottleneck or pick one waiting item. The ship waits until you name the constraint.",
          }),
    ]);

    var staff = el("aside", { className: "panel" }, [
      el("h2", { text: "You, then staff" }),
      el("div", { className: "staff" }, [
        el("div", { className: "you", text: "You" }),
        el("div", { className: "stem", "aria-hidden": "true" }),
        el("div", { className: "org" }, [
          el("div", { className: "staff-card" }, [
            el("b", { text: "Grok Bot CoS" }),
            document.createTextNode("Writes only to vault KIP folders."),
          ]),
          el("div", { className: "staff-card" }, [
            el("b", { text: "Claude" }),
            document.createTextNode("Staff. Not a peer."),
          ]),
          el("div", { className: "staff-card" }, [
            el("b", { text: "Grok CLI" }),
            document.createTextNode("Staff. Not a peer."),
          ]),
        ]),
      ]),
      el("p", {
        className: "rule",
        text: "Staff sit under you, never beside you. CoS may write only in vault KIP folders. Everything else in the vault is Bob-only.",
      }),
      el("div", { className: "bins" }, [
        el("div", { className: "bin" }, [
          el("strong", { text: "Report" }),
          document.createTextNode("What they found. No live mail or calendar here."),
        ]),
        el("div", { className: "bin" }, [
          el("strong", { text: "Proposed do" }),
          document.createTextNode("An action they want you to take."),
        ]),
        el("div", { className: "bin" }, [
          el("strong", { text: "Proposed edit" }),
          document.createTextNode("A change they want you to accept."),
        ]),
      ]),
    ]);

    var waitingBox = el("section", { className: "panel" }, [el("h2", { text: "Waiting" })]);
    if (!waiting.length) {
      waitingBox.appendChild(el("p", { className: "empty", text: "No other bottlenecks waiting." }));
    } else {
      var grid = el("div", { className: "waiting-grid" });
      waiting.forEach(function (item) {
        grid.appendChild(renderCard(item));
      });
      waitingBox.appendChild(grid);
    }

    function field(tag, id) {
      var node = el(tag, { id: id, name: id, required: "required" });
      node.value = draft[id] || "";
      node.addEventListener("input", function () {
        draft[id] = node.value;
      });
      return node;
    }

    var addForm = el("form", {
      onSubmit: function (event) {
        event.preventDefault();
        draft = {
          stuck: document.getElementById("stuck").value,
          why: document.getElementById("why").value,
          unstick: document.getElementById("unstick").value,
        };
        var result = Board.addBottleneck(board, draft);
        if (!result.ok) {
          formError = result.error;
          draw();
          return;
        }
        board = result.board;
        formError = "";
        draft = { stuck: "", why: "", unstick: "" };
        persist();
        draw();
      },
    });
    addForm.appendChild(el("label", { text: "What is stuck" }, [field("input", "stuck")]));
    addForm.appendChild(el("label", { text: "Why it is stuck" }, [field("textarea", "why")]));
    addForm.appendChild(
      el("label", { text: "Yes or act that would unstick it" }, [field("textarea", "unstick")])
    );
    addForm.appendChild(el("p", { className: "form-error", text: formError }));
    addForm.appendChild(el("button", { type: "submit", text: "Add bottleneck" }));

    var addBox = el("section", { className: "panel" }, [
      el("h2", { text: "Add a bottleneck" }),
      addForm,
    ]);

    var removedBox = el("section", { className: "panel removed-row" }, [el("h2", { text: "Removed / caused" })]);
    if (!removed.length) {
      removedBox.appendChild(
        el("p", { className: "empty", text: "Nothing marked removed yet. When the yes or act happens, park it here." })
      );
    } else {
      var gone = el("div", { className: "removed-list" });
      removed.forEach(function (item) {
        gone.appendChild(renderCard(item));
      });
      removedBox.appendChild(gone);
    }

    var fine = el("p", { className: "fine" }, [
      document.createTextNode("Rows marked Example are seeds, not live metrics. This page remembers your board in this browser."),
    ]);
    if (!board.items.some(function (item) { return item.example; })) {
      fine.appendChild(
        el("button", {
          className: "secondary",
          type: "button",
          text: "Put the example rows back",
          onClick: function () {
            board = Board.restoreExamples(board, SEED).board;
            persist();
            draw();
          },
        })
      );
    }

    var hud = el("div", { className: "hud" }, [
      el("i", { className: "hud-lamp" + (live ? " on" : ""), "aria-hidden": "true" }),
      el("strong", { text: live ? "Live constraint" : "No live constraint" }),
      el("span", { text: live ? live.stuck : "Name the stuck thing. The ship waits." }),
    ]);

    root.appendChild(mast);
    root.appendChild(hud);
    root.appendChild(el("div", { className: "deck" }, [liveBox, staff]));
    root.appendChild(el("div", { className: "deck", style: null }, [waitingBox, addBox]));
    root.appendChild(removedBox);
    root.appendChild(fine);
  }

  draw();
})();
