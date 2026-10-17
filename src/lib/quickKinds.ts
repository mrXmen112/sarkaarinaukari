/**
 * Quick Publish vocabulary — client-safe (no server-only imports), so both the
 * extraction helper and the admin form can share one source of truth.
 */

export const QUICK_KINDS = ["job", "result", "admit-card", "answer-key"] as const;
export type QuickKind = (typeof QUICK_KINDS)[number];

export function isQuickKind(value: string): value is QuickKind {
  return (QUICK_KINDS as readonly string[]).includes(value);
}

export const QUICK_KIND_LABELS: Record<QuickKind, string> = {
  job: "Job notification",
  result: "Result",
  "admit-card": "Admit card",
  "answer-key": "Answer key",
};

const KIND_TO_TARGET: Record<QuickKind, string> = {
  job: "job",
  result: "result",
  "admit-card": "admit_card",
  "answer-key": "answer_key",
};

export function quickTargetType(kind: QuickKind): string {
  return KIND_TO_TARGET[kind];
}
