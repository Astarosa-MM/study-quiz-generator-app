'use client';

import { useState } from 'react';
import { ArrowRight, BookOpen, Check, CircleHelp, FileText, Gauge, ListChecks, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const quizLengths = [5, 10, 15];
const questionTypes = [
  { value: 'multiple-choice', label: 'Multiple choice', description: 'Choose one answer from four options', icon: ListChecks },
  { value: 'true-false', label: 'True or false', description: 'Quick statements to test recall', icon: CircleHelp },
  { value: 'mixed', label: 'A mix of both', description: 'A balanced set of question styles', icon: Sparkles },
];
const difficulties = [
  { value: 'easy', label: 'Easy', description: 'Straight from your notes' },
  { value: 'medium', label: 'Medium', description: 'Recall and understanding' },
  { value: 'hard', label: 'Hard', description: 'Apply what you learned' },
];

export default function Home() {
  const [notes, setNotes] = useState('');
  const [quizLength, setQuizLength] = useState(10);
  const [questionType, setQuestionType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const canGenerate = notes.trim().length >= 20;

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (canGenerate) setShowConfirmation(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#main-content" className="flex items-center gap-3" aria-label="Recall home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BookOpen className="size-4.5" aria-hidden="true" /></span>
            <span className="font-heading text-[1.05rem] font-bold tracking-[-0.025em]">Recall</span>
          </a>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">New quiz</span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
        <section id="main-content" aria-labelledby="page-title">
          <div className="mb-9 max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><Sparkles className="size-3.5" aria-hidden="true" />Study smarter</p>
            <h1 id="page-title" className="font-heading text-4xl font-bold tracking-[-0.045em] text-balance sm:text-5xl">Turn your notes into a quiz.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Paste in what you’re studying, choose how you want to practice, and we’ll handle the rest.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <Label htmlFor="study-notes" className="text-[0.95rem] font-bold">Your study notes</Label>
                  <p id="notes-help" className="mt-1.5 text-sm text-muted-foreground">Definitions, lecture notes, or a chapter summary all work well.</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{notes.length.toLocaleString()} characters</span>
              </div>
              <div className="relative">
                <Textarea id="study-notes" aria-describedby="notes-help" value={notes} onChange={(event) => { setNotes(event.target.value); setShowConfirmation(false); }} placeholder={'Paste your notes here…\n\nExample: Photosynthesis occurs in chloroplasts. Plants use light energy to convert carbon dioxide and water into glucose and oxygen.'} className="min-h-64 resize-y rounded-2xl border-border bg-card p-5 text-[0.95rem] leading-7 shadow-[0_1px_2px_rgb(18_40_32/4%),0_12px_35px_rgb(18_40_32/4%)] placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-primary/15 sm:min-h-72" />
                <div className="pointer-events-none absolute bottom-4 right-4 grid size-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm"><FileText className="size-4" aria-hidden="true" /></div>
              </div>
            </div>

            <fieldset>
              <legend className="text-[0.95rem] font-bold">Quiz length</legend>
              <p className="mt-1.5 text-sm text-muted-foreground">How many questions would you like?</p>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
                {quizLengths.map((length) => <button key={length} type="button" aria-pressed={quizLength === length} onClick={() => setQuizLength(length)} className="rounded-xl border border-border bg-card px-3 py-3 text-sm font-bold shadow-sm transition hover:border-primary/35 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-primary">{length} questions</button>)}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[0.95rem] font-bold">Question type</legend>
              <p className="mt-1.5 text-sm text-muted-foreground">Pick the format that helps you learn best.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {questionTypes.map(({ value, label, description, icon: Icon }) => {
                  const selected = questionType === value;
                  return <button key={value} type="button" aria-pressed={selected} onClick={() => setQuestionType(value)} className="group relative rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-accent">
                    <span className="mb-4 grid size-9 place-items-center rounded-xl bg-secondary text-secondary-foreground transition group-aria-pressed:bg-primary group-aria-pressed:text-primary-foreground"><Icon className="size-4.5" aria-hidden="true" /></span>
                    <span className="block pr-6 text-sm font-bold">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
                    {selected && <Check className="absolute right-4 top-4 size-4 text-primary" aria-hidden="true" />}
                  </button>;
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[0.95rem] font-bold">Difficulty</legend>
              <p className="mt-1.5 text-sm text-muted-foreground">Choose how challenging your quiz should feel.</p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:grid sm:grid-cols-3">
                {difficulties.map(({ value, label, description }, index) => {
                  const selected = difficulty === value;
                  return <button key={value} type="button" aria-pressed={selected} onClick={() => setDifficulty(value)} className={`relative w-full px-5 py-4 text-left transition hover:bg-accent focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40 aria-pressed:bg-accent ${index > 0 ? 'border-t border-border sm:border-l sm:border-t-0' : ''}`}>
                    <span className="flex items-center justify-between gap-3 text-sm font-bold">{label}<span className={`size-3 rounded-full border-2 ${selected ? 'border-primary bg-primary ring-2 ring-primary/15 ring-offset-2' : 'border-border'}`} /></span>
                    <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                  </button>;
                })}
              </div>
            </fieldset>

            <div className="border-t border-border pt-6">
              <Button type="submit" size="lg" disabled={!canGenerate} className="h-12 w-full rounded-xl px-5 text-[0.95rem] font-bold shadow-[0_10px_25px_rgb(30_94_70/18%)] sm:w-auto">Generate my quiz<ArrowRight data-icon="inline-end" /></Button>
              {!canGenerate && <p className="mt-3 text-xs text-muted-foreground">Add at least 20 characters of notes to continue.</p>}
              {showConfirmation && <output className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-accent px-4 py-3 text-sm font-medium text-primary"><Check className="size-4" aria-hidden="true" />Your quiz setup is ready. The quiz experience is coming next.</output>}
            </div>
          </form>
        </section>

        <aside className="lg:pt-31" aria-label="Quiz setup summary">
          <div className="sticky top-8 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(18_40_32/4%),0_18px_45px_rgb(18_40_32/5%)]">
            <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-secondary text-primary"><Gauge className="size-4" aria-hidden="true" /></span><h2 className="text-sm font-bold">Quiz setup</h2></div>
            <dl className="mt-5 space-y-4 border-t border-border pt-5 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Questions</dt><dd className="font-bold">{quizLength}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Format</dt><dd className="font-bold capitalize">{questionType.replaceAll('-', ' ')}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Difficulty</dt><dd className="font-bold capitalize">{difficulty}</dd></div>
            </dl>
            <div className="mt-5 rounded-xl bg-secondary/70 p-4"><p className="text-xs font-bold text-secondary-foreground">A quick tip</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Clear, focused notes make better questions. Include key terms, definitions, and examples.</p></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
