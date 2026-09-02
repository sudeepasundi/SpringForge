import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, CircleHelp, RotateCcw, X } from 'lucide-react';
import { useProgress } from '@/store/progress';
import { cn } from '@/lib/cn';
import type { QuizQuestion } from '@/lib/types';

type Answers = Record<string, number[]>;

function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
}

export function Quiz({
  id = 'check',
  title = 'Check your understanding',
  questions,
}: {
  id?: string;
  title?: string;
  questions: QuizQuestion[];
}) {
  const params = useParams();
  const lessonPath = `${params.moduleSlug ?? 'unknown'}/${params.lessonSlug ?? 'unknown'}`;
  const storeKey = `${lessonPath}#${id}`;

  const recordQuiz = useProgress((s) => s.recordQuiz);
  const previous = useProgress((s) => s.quizzes[storeKey]);

  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () =>
      questions.reduce(
        (n, q) => n + (sameSet(answers[q.id] ?? [], q.correct) ? 1 : 0),
        0,
      ),
    [answers, questions],
  );

  const answeredAll = questions.every((q) => (answers[q.id] ?? []).length > 0);

  function toggle(q: QuizQuestion, option: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const current = prev[q.id] ?? [];
      if (q.correct.length === 1) return { ...prev, [q.id]: [option] };
      return {
        ...prev,
        [q.id]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
  }

  function submit() {
    setSubmitted(true);
    recordQuiz(storeKey, score, questions.length);
  }

  function retry() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <section
      className="sf-block overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] shadow-[var(--sf-shadow)]"
      aria-label={title}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-[color:var(--sf-surface-2)] px-4 py-3">
        <h3 className="m-0! flex items-center gap-2 border-0! p-0! text-[0.95rem]! font-semibold">
          <CircleHelp size={16} className="text-[color:var(--sf-accent)]" />
          {title}
        </h3>
        <span className="text-[0.72rem] text-[color:var(--sf-text-faint)]">
          {submitted
            ? `${score} / ${questions.length} correct`
            : previous
              ? `Best: ${previous.score} / ${previous.total}`
              : `${questions.length} questions`}
        </span>
      </header>

      <ol className="m-0 list-none p-0">
        {questions.map((q, qi) => {
          const chosen = answers[q.id] ?? [];
          const correct = sameSet(chosen, q.correct);
          const multi = q.correct.length > 1;
          return (
            <li key={q.id} className="border-b px-4 py-4 last:border-b-0">
              <p className="m-0 flex gap-2.5 text-[0.94rem] font-medium">
                <span className="text-[color:var(--sf-text-faint)] tabular-nums">{qi + 1}.</span>
                <span>
                  {q.prompt}
                  {multi && (
                    <span className="ml-2 rounded border px-1.5 py-0.5 align-middle text-[0.62rem] font-semibold tracking-wide text-[color:var(--sf-text-faint)] uppercase">
                      select all
                    </span>
                  )}
                </span>
              </p>

              <div className="mt-3 grid gap-1.5 pl-6">
                {q.options.map((option, oi) => {
                  const picked = chosen.includes(oi);
                  const isCorrect = q.correct.includes(oi);
                  const state = !submitted
                    ? picked
                      ? 'picked'
                      : 'idle'
                    : isCorrect
                      ? 'right'
                      : picked
                        ? 'wrong'
                        : 'idle';
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggle(q, oi)}
                      disabled={submitted}
                      aria-pressed={picked}
                      className={cn(
                        'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-[0.88rem] transition',
                        state === 'idle' &&
                          'border-[color:var(--sf-border)] hover:border-[color:var(--sf-border-strong)] hover:bg-[color:var(--sf-surface-2)]',
                        state === 'picked' &&
                          'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)]',
                        state === 'right' &&
                          'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)]',
                        state === 'wrong' &&
                          'border-[color:var(--sf-danger)] bg-[color:var(--sf-danger-soft)]',
                        submitted && 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px]',
                          multi ? 'rounded-[4px]' : 'rounded-full',
                          state === 'right' &&
                            'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent)] text-white',
                          state === 'wrong' &&
                            'border-[color:var(--sf-danger)] bg-[color:var(--sf-danger)] text-white',
                          state === 'picked' && 'border-[color:var(--sf-accent)]',
                        )}
                      >
                        {state === 'right' && <Check size={10} strokeWidth={3.5} />}
                        {state === 'wrong' && <X size={10} strokeWidth={3.5} />}
                        {state === 'picked' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--sf-accent)]" />
                        )}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  className={cn(
                    'mt-3 ml-6 rounded-lg border-l-[3px] px-3 py-2.5 text-[0.85rem] leading-relaxed',
                    correct
                      ? 'border-l-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)]'
                      : 'border-l-[color:var(--sf-warn)] bg-[color:var(--sf-warn-soft)]',
                  )}
                >
                  <strong className="mr-1.5">{correct ? 'Correct.' : 'Not quite.'}</strong>
                  <span className="text-[color:var(--sf-text-muted)]">{q.explanation}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="flex items-center justify-between gap-3 border-t bg-[color:var(--sf-surface-2)] px-4 py-3">
        <p className="m-0 text-[0.78rem] text-[color:var(--sf-text-muted)]">
          {submitted
            ? score === questions.length
              ? 'All correct — move on with confidence.'
              : 'Read the explanations, then try again.'
            : answeredAll
              ? 'Ready when you are.'
              : 'Answer every question to submit.'}
        </p>
        {submitted ? (
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.82rem] font-medium hover:bg-[color:var(--sf-surface)]"
          >
            <RotateCcw size={13} /> Try again
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!answeredAll}
            className="rounded-lg bg-[color:var(--sf-accent)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-white transition enabled:hover:bg-[color:var(--sf-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check answers
          </button>
        )}
      </footer>
    </section>
  );
}
