'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, CircleCheck, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { readQuizHistory } from '@/lib/quiz-history';

function subscribeToHydration() {
  return () => undefined;
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function HistoryPage() {
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const history = isHydrated ? readQuizHistory() : [];
  const averageScore = history.length
    ? Math.round(history.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions) * 100, 0) / history.length)
    : 0;
  const totalCorrect = history.reduce((sum, quiz) => sum + quiz.score, 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Recall home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BookOpen className="size-4.5" /></span>
            <span className="font-heading text-[1.05rem] font-bold tracking-[-0.025em]">Recall</span>
          </Link>
          <Button nativeButton={false} render={<Link href="/" />} size="sm" className="rounded-xl">New quiz<Plus data-icon="inline-end" /></Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><History className="size-3.5" />Your progress</p>
            <h1 className="font-heading text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Quiz history</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">Review your past scores and see how your recall is improving.</p>
          </div>
        </div>

        {history.length > 0 ? (
          <>
            <section aria-label="History summary" className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Quizzes completed', value: history.length, icon: CircleCheck },
                { label: 'Average score', value: `${averageScore}%`, icon: ChartNoAxesColumnIncreasing },
                { label: 'Correct answers', value: totalCorrect, icon: BookOpen },
              ].map(({ label, value, icon: Icon }) => (
                <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-4.5" /></span>
                  <p className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em]">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </article>
              ))}
            </section>

            <section aria-labelledby="recent-quizzes" className="mt-10">
              <h2 id="recent-quizzes" className="font-heading text-xl font-bold tracking-[-0.025em]">Recent quizzes</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <ul className="divide-y divide-border">
                  {history.map((quiz) => {
                    const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);
                    return (
                      <li key={quiz.id}>
                        <Link href={`/results?id=${encodeURIComponent(quiz.id)}`} className="group flex flex-col gap-4 p-5 transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="flex items-start gap-4">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary font-heading text-sm font-bold text-primary">{percentage}%</span>
                            <div>
                              <p className="font-bold">{quiz.score} of {quiz.totalQuestions} correct</p>
                              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateFormatter.format(new Date(quiz.completedAt))}</span><span className="capitalize">{quiz.difficulty} · {quiz.questionType.replaceAll('-', ' ')}</span></p>
                            </div>
                          </div>
                          <span className="flex items-center gap-2 self-end text-sm font-bold text-primary sm:self-auto">View results<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-10 grid min-h-96 place-items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><History className="size-6" /></span>
              <h2 className="mt-5 font-heading text-2xl font-bold tracking-[-0.03em]">No quizzes yet</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Complete your first quiz and your score, settings, and results will appear here.</p>
              <Button nativeButton={false} render={<Link href="/" />} size="lg" className="mt-6 h-11 rounded-xl px-5">Create a quiz<ArrowRight data-icon="inline-end" /></Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

