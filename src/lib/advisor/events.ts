/** Events streamed from /api/advisor/chat to the browser, one JSON object per line. */
export type AdvisorEvent =
  | { t: "status"; v: string }
  | { t: "text"; v: string }
  /** Discard answer text after this many characters (a failed attempt is being retried). */
  | { t: "rewind"; v: number }
  | { t: "build"; v: Record<string, number> }
  | { t: "error"; v: string }
  | { t: "done" };
