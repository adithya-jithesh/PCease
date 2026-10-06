/** Events streamed from /api/advisor/chat to the browser, one JSON object per line. */
export type AdvisorEvent =
  | { t: "status"; v: string }
  | { t: "text"; v: string }
  | { t: "build"; v: Record<string, number> }
  | { t: "error"; v: string }
  | { t: "done" };
