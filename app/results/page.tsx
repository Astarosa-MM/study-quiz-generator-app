'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleCheck, CircleX, History, RotateCcw, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { readQuizHistory } from '@/lib/quiz-history';

function subscribeToHydration() {
  return () => undefined;
}

function readResult() {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get('id');
  return readQuizHistory().find((quiz) => quiz.id === id) ?? null;
}

export default function ResultsPage() {
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const result = isHydrated ? readResult() : null;

  if (!result) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[0_20px_55px_rgb(18_40_32/6%)]">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Target className="size-5" /></span>
          <h1 className="mt-5 font-heading text-2xl font-bold tracking-[-0.03em]">Results not found</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">This quiz result may no longer be saved on this device.</p>
          <Button nativeButton={false} render={<Link href="/history" />} size="lg" className="mt-6 h-11 rounded-xl px-5">View quiz history<ArrowRight data-icon="inline-end" /></Button>
        </section>
      </main>
    );
  }

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const incorrect = result.totalQuestions - result.score;
  const message = percentage === 100 ? 'Perfect recall!' : percentage >= 80 ? 'Great work!' : percentage >= 60 ? 'Nice progress!' : 'Keep practicing!';

  function retryMissedQuestions() {
    const retryQuestions = result!.questions
      .filter((question) => question.selectedAnswer !== question.correctAnswer)
      .map((question) => ({
        prompt: question.prompt,
        choices: question.choices,
        answer: question.correctAnswer,
      }));

    window.sessionStorage.setItem('recall-quiz-setup', JSON.stringify({
      notes: '',
      quizLength: retryQuestions.length,
      questionType: result!.questionType,
      difficulty: result!.difficulty,
      retryQuestions,
    }));
    window.location.assign('/quiz');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Recall home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BookOpen className="size-4.5" /></span>
            <span className="font-heading text-[1.05rem] font-bold tracking-[-0.025em]">Recall</span>
          </Link>
          <Link href="/history" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"><History className="size-3.5" />Quiz history</Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <section aria-labelledby="results-title" className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgb(18_40_32/4%),0_20px_55px_rgb(18_40_32/6%)]">
          <div className="bg-secondary/55 px-5 py-10 text-center sm:px-10 sm:py-12">
            <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary"><Sparkles className="size-3.5" />Quiz complete</span>
            <h1 id="results-title" className="mt-5 font-heading text-4xl font-bold tracking-[-0.045em] sm:text-5xl">{message}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">You answered {result.score} of {result.totalQuestions} questions correctly.</p>

            <div className="relative mx-auto mt-8 grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${percentage}%, var(--border) 0)` }} aria-label={`${percentage} percent score`}>
              <div className="grid size-31 place-items-center rounded-full bg-card shadow-inner">
                <div><p className="font-heading text-4xl font-bold tracking-[-0.05em]">{percentage}%</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">Your score</p></div>
              </div>
            </div>

            <dl className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-primary/15 bg-card p-4"><dt className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground"><CircleCheck className="size-4 text-primary" />Correct</dt><dd className="mt-1 font-heading text-2xl font-bold">{result.score}</dd></div>
              <div className="rounded-2xl border border-border bg-card p-4"><dt className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground"><CircleX className="size-4" />Review</dt><dd className="mt-1 font-heading text-2xl font-bold">{incorrect}</dd></div>
            </dl>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:justify-center sm:p-7">
            {incorrect > 0 && <Button type="button" onClick={retryMissedQuestions} size="lg" className="h-11 rounded-xl px-5"><RotateCcw data-icon="inline-start" />Retry missed questions</Button>}
            <Button nativeButton={false} render={<Link href="/" />} variant={incorrect > 0 ? 'outline' : 'default'} size="lg" className="h-11 rounded-xl px-5">Create another quiz</Button>
            <Button nativeButton={false} render={<Link href="/history" />} variant="outline" size="lg" className="h-11 rounded-xl px-5">View history<ArrowRight data-icon="inline-end" /></Button>
          </div>
        </section>

        <section aria-labelledby="answer-review" className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Learn from every answer</p><h2 id="answer-review" className="mt-2 font-heading text-2xl font-bold tracking-[-0.03em]">Answer review</h2></div>
            <span className="text-xs font-semibold text-muted-foreground">{result.totalQuestions} questions</span>
          </div>

          <ol className="mt-5 space-y-4">
            {result.questions.map((question, index) => {
              const isCorrect = question.selectedAnswer === question.correctAnswer;
              return (
                <li key={`${question.prompt}-${index}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${isCorrect ? 'bg-secondary text-primary' : 'bg-destructive/10 text-destructive'}`}>{isCorrect ? <Check className="size-4" /> : <CircleX className="size-4" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Question {index + 1}</p>
                      <h3 className="mt-2 font-heading text-base font-bold leading-6">{question.prompt}</h3>
                      <dl className="mt-4 grid gap-2 text-sm">
                        <div className={`rounded-xl px-4 py-3 ${isCorrect ? 'bg-secondary/70' : 'bg-destructive/8'}`}><dt className="text-xs font-bold text-muted-foreground">Your answer</dt><dd className="mt-1 font-semibold">{question.choices[question.selectedAnswer]}</dd></div>
                        {!isCorrect && <div className="rounded-xl bg-secondary/70 px-4 py-3"><dt className="text-xs font-bold text-muted-foreground">Correct answer</dt><dd className="mt-1 font-semibold text-primary">{question.choices[question.correctAnswer]}</dd></div>}
                      </dl>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <Link href="/history" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" />Back to quiz history</Link>
      </div>
    </main>
  );
}
