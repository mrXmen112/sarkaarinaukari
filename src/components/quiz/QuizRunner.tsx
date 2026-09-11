"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { saveQuizAttempt } from "@/app/actions/profile";
import type { QuizQuestion } from "@/types/database";

type SaveState = "idle" | "saving" | "saved" | "anon" | "error";

export default function QuizRunner({
  quizId,
  questions,
}: {
  quizId: string;
  questions: QuizQuestion[];
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const isLast = current === questions.length - 1;
  const allAnswered = answers.every((a) => a !== null);

  const score = useMemo(
    () =>
      questions.reduce(
        (acc, q, i) => (answers[i] === q.correct_index ? acc + 1 : acc),
        0,
      ),
    [answers, questions],
  );

  if (questions.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No questions published for this quiz yet.
      </p>
    );
  }

  function selectOption(index: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = index;
      return next;
    });
  }

  function goTo(index: number) {
    setCurrent(index);
  }

  function submit() {
    setSubmitted(true);
    setSaveState("saving");
    saveQuizAttempt({ quizId, score, total: questions.length })
      .then((res) => {
        setSaveState(res.ok ? "saved" : "anon");
      })
      .catch(() => setSaveState("error"));
  }

  function reset() {
    setCurrent(0);
    setAnswers(questions.map(() => null));
    setSubmitted(false);
    setSaveState("idle");
  }

  if (submitted) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-4">
        <div className="rounded border border-navy-200 bg-navy-50/40 p-4">
          <h2 className="text-lg font-bold text-navy">
            Your Score: {score} / {questions.length}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {percent >= 70
              ? "Excellent! You are exam-ready."
              : percent >= 40
                ? "Good effort. Review the answers below and practice again."
                : "Keep practising — review the explanations below and retake."}{" "}
            ({percent}%)
          </p>
          <p className="mt-2 text-xs">
            {saveState === "saved" && (
              <span className="font-medium text-green-800">
                ✓ Score saved to your dashboard.
              </span>
            )}
            {saveState === "anon" && (
              <span className="text-ink-muted">
                <Link href="/login" className="font-semibold text-navy underline">
                  Sign in
                </Link>{" "}
                to save your score and track progress.
              </span>
            )}
            {saveState === "error" && (
              <span className="text-ink-muted">
                Couldn&apos;t save your score just now.
              </span>
            )}
          </p>
        </div>

        <ol className="space-y-3">
          {questions.map((q, i) => {
            const chosen = answers[i];
            const correct = chosen === q.correct_index;
            return (
              <li key={i} className="rounded border border-rule p-3">
                <p className="font-semibold">
                  Q{i + 1}. {q.question}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((opt, o) => {
                    const isChosen = chosen === o;
                    const isCorrect = q.correct_index === o;
                    let cls = "text-ink-muted";
                    if (isCorrect) cls = "font-semibold text-green-800";
                    else if (isChosen) cls = "font-semibold text-red-700";
                    return (
                      <li key={o} className={cls}>
                        {isCorrect ? "✓ " : isChosen ? "✗ " : "• "}
                        {opt}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation ? (
                  <p className="mt-2 text-xs text-ink-muted">
                    Why: {q.explanation}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={reset}
          className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>Answered {answers.filter((a) => a !== null).length}</span>
      </div>

      <div className="rounded border border-rule p-4">
        <p className="font-semibold">
          Q{current + 1}. {q.question}
        </p>
        <ul className="mt-3 space-y-1.5">
          {q.options.map((opt, o) => {
            const active = answers[current] === o;
            return (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => selectOption(o)}
                  className={
                    "block w-full rounded border px-3 py-2 text-left text-sm " +
                    (active
                      ? "border-navy bg-navy-50 font-semibold text-navy"
                      : "border-rule hover:border-navy-300")
                  }
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="rounded border border-rule px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered}
            className="rounded bg-saffron px-4 py-2 text-sm font-bold text-navy disabled:opacity-40"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={answers[current] === null}
            className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}