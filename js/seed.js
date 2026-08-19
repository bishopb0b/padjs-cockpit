/**
 * EXAMPLE construction tasks. Not staff boxes. Not live KIP contents.
 * Claude signaled work in vault KIP folders; this seed only stands in
 * until the Mac vault can be read.
 */
(function (root) {
  var SEED = {
    tasks: [
      {
        id: "ex-mac-home",
        example: true,
        mark: "Mac",
        name: "Seat Bot file work on one Mac",
        constructor: "Bob can still pick Air or Mini as home",
        inputs: [],
        outputs: ["Shared file home"],
        produced: [],
        x: 56,
        y: 48,
      },
      {
        id: "ex-work-graph",
        example: true,
        mark: "Graph",
        name: "Model the work as a construction graph",
        constructor: "This page can still do it",
        inputs: ["Shared file home"],
        outputs: ["Flyable work graph"],
        produced: [],
        x: 460,
        y: 48,
      },
      {
        id: "ex-funds",
        example: true,
        mark: "Funds",
        name: "Place JointSpace funds",
        constructor: "Bob can still place the funds",
        inputs: [],
        outputs: ["JointSpace funds"],
        produced: [],
        x: 56,
        y: 250,
      },
      {
        id: "ex-ip",
        example: true,
        mark: "IP",
        name: "Place OPERhythm IP",
        constructor: "Bob can still place the IP",
        inputs: [],
        outputs: ["OPERhythm IP"],
        produced: [],
        x: 56,
        y: 400,
      },
      {
        id: "ex-dice",
        example: true,
        mark: "Dice",
        name: "Productize the dice study",
        constructor: "Bob can still productize it",
        inputs: [],
        outputs: ["Dice-study product"],
        produced: [],
        x: 56,
        y: 550,
      },
      {
        id: "ex-becker",
        example: true,
        mark: "Becker",
        name: "Tuesday Becker go/no-go",
        constructor: "Bob can still decide, once the inputs exist",
        inputs: ["JointSpace funds", "OPERhythm IP", "Dice-study product"],
        outputs: ["Go or no-go"],
        produced: [],
        x: 460,
        y: 360,
      },
    ],
    edges: [
      {
        id: "e-mac-graph",
        fromId: "ex-mac-home",
        fromOutput: "Shared file home",
        toId: "ex-work-graph",
        toInput: "Shared file home",
      },
      {
        id: "e-funds-becker",
        fromId: "ex-funds",
        fromOutput: "JointSpace funds",
        toId: "ex-becker",
        toInput: "JointSpace funds",
      },
      {
        id: "e-ip-becker",
        fromId: "ex-ip",
        fromOutput: "OPERhythm IP",
        toId: "ex-becker",
        toInput: "OPERhythm IP",
      },
      {
        id: "e-dice-becker",
        fromId: "ex-dice",
        fromOutput: "Dice-study product",
        toId: "ex-becker",
        toInput: "Dice-study product",
      },
    ],
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SEED;
  } else {
    root.PadjsSeed = SEED;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
