/**
 * Seed tokens are labeled EXAMPLE. They are not live mail, calendar, or metrics.
 */
(function (root) {
  var SEED = [
    {
      id: "ex-becker",
      live: true,
      example: true,
      label: "Becker go/no-go",
      yes: "YES: funds · IP · dice",
      stuck: "Tuesday Becker go/no-go is still open",
      why: "JointSpace funds, OPERhythm IP, and dice-study productization are not yet in place.",
      unstick: "Yes on funds, IP, and a productized dice study — or a clear no-go.",
    },
    {
      id: "ex-mac",
      example: true,
      label: "One Mac at a time",
      yes: "YES: one Mac home",
      stuck: "Grok Bot file work is one Mac at a time",
      why: "The Air and the Mini are different machines. File work does not follow Bob from one to the other.",
      unstick: "Pick one Mac as the Bot's home, or put the working folder where both machines can use the same files.",
    },
    {
      id: "ex-cockpit",
      example: true,
      label: "No cockpit yet",
      yes: "YES: fly this page",
      stuck: "The cockpit screen did not exist",
      why: "The ship-of-state idea lived in notes. There was no first page Bob could open and fly.",
      unstick: "Open this page. Keep one live bottleneck honest. Mark it removed when the yes or act has happened.",
    },
  ];

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SEED;
  } else {
    root.PadjsSeed = SEED;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
