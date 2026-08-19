/**
 * One or two lines for a mark. Not a form. Not a page.
 */
(function (root) {
  function pair(a, b) {
    return { a: a || "", b: b || "" };
  }

  function taskSay(viewItem, isLive) {
    var task = viewItem.task;
    if (isLive) {
      return pair(
        task.name,
        viewItem.locked
          ? "Live bottleneck — locked until a predecessor produces the input."
          : "Live bottleneck — can run."
      );
    }
    if (viewItem.locked) {
      return pair(task.name, "Locked until a predecessor produces the input.");
    }
    if (viewItem.done) {
      return pair(task.name, "Outputs exist.");
    }
    return pair(task.name, task.constructor || "");
  }

  function lockSay() {
    return pair("Locked until a predecessor produces the input.");
  }

  function inputSay(name, have) {
    return pair((have ? "Have: " : "Waiting: ") + name);
  }

  function outputSay(name, have) {
    return pair((have ? "Exists: " : "Not yet: ") + name);
  }

  function liveSay(live) {
    if (!live) return pair("No live mark");
    var mark = live.task.mark || live.task.name;
    return pair("Live: " + mark, live.task.name + (live.locked ? " — locked" : " — can run"));
  }

  function safeKind(name) {
    return /minutes/i.test(String(name || "")) ? "minutes" : "cert";
  }

  function safeInSay(name) {
    return pair("In safe: " + name);
  }

  function nextPrintSay(next) {
    var contains = next && next.contains;
    if (Array.isArray(contains)) contains = contains.join(" · ");
    return pair("Next print: " + ((next && next.name) || ""), contains || "");
  }

  var Signal = {
    taskSay: taskSay,
    lockSay: lockSay,
    inputSay: inputSay,
    outputSay: outputSay,
    liveSay: liveSay,
    safeKind: safeKind,
    safeInSay: safeInSay,
    nextPrintSay: nextPrintSay,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Signal;
  } else {
    root.PadjsSignal = Signal;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
