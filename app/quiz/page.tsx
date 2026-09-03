'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Check, FileText, Flag, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { saveQuizResult } from '@/lib/quiz-history';

type QuizSetup = {
  notes: string;
  quizLength: number;
  questionType: string;
  difficulty: string;
  quizSeed?: number;
};

type GeneratedQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
};

type NoteSection = {
  topic: string;
  facts: string[];
};

const stopWords = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between', 'could', 'does', 'during',
  'each', 'from', 'have', 'into', 'itself', 'other', 'should', 'than', 'that', 'their', 'there', 'these',
  'they', 'this', 'those', 'through', 'using', 'very', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your',
]);

function cleanWord(word: string) {
  return word.replace(/^[^a-z0-9]+|[^a-z0-9-]+$/gi, '');
}

function uniqueWords(notes: string) {
  const seen = new Set<string>();
  return notes
    .split(/\s+/)
    .map(cleanWord)
    .filter((word) => {
      const normalized = word.toLowerCase();
      if (word.length < 3 || stopWords.has(normalized) || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function parseNoteSections(notes: string): NoteSection[] {
  const lines = notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections: NoteSection[] = [];
  let activeSection: NoteSection | null = null;
  let parentFact = '';

  for (const rawLine of lines) {
    const bullet = rawLine.match(/^([•●▪◦○■*\-–—])\s*/)?.[1] ?? '';
    const isBullet = Boolean(bullet);
    const line = rawLine.replace(/^[•●▪◦○■*\-–—]\s*/, '').trim();
    const wordCount = line.split(/\s+/).length;
    const isHeading = !isBullet && (line.endsWith(':') || (wordCount <= 7 && !/[.!?]$/.test(line)));

    if (isHeading) {
      activeSection = { topic: line.replace(/:\s*$/, ''), facts: [] };
      sections.push(activeSection);
      parentFact = '';
      continue;
    }

    if (!activeSection) {
      activeSection = { topic: 'General notes', facts: [] };
      sections.push(activeSection);
    }

    const isNestedBullet = ['○', '◦', '▪', '■'].includes(bullet);
    const contextualFact = isNestedBullet && parentFact ? `${parentFact} — ${line}` : line;
    activeSection.facts.push(contextualFact);
    if (!isNestedBullet) parentFact = line;
  }

  return sections.filter((section) => section.facts.length > 0);
}

function replaceWord(statement: string, target: string, replacement: string) {
  const start = statement.toLowerCase().indexOf(target.toLowerCase());
  if (start < 0) return statement;
  return `${statement.slice(0, start)}${replacement}${statement.slice(start + target.length)}`;
}

function shuffled<T>(items: T[], seed: number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = (seed * 7 + index * 3) % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function generateQuestions(setup: QuizSetup): GeneratedQuestion[] {
  const sections = parseNoteSections(setup.notes);
  const words = uniqueWords(setup.notes);
  const seed = setup.quizSeed ?? 1;
  const entries = shuffled(
    sections.flatMap((section, sectionIndex) => section.facts.map((fact) => ({ fact, section, sectionIndex }))),
    seed,
  );

  return Array.from({ length: setup.quizLength }, (_, index) => {
    const entry = entries[index % Math.max(entries.length, 1)];
    const useTrueFalse = setup.questionType === 'true-false' || (setup.questionType === 'mixed' && index % 2 === 1);

    if (entry && useTrueFalse && sections.length > 1) {
      const isTrue = (index + seed) % 2 === 0;
      const wrongTopics = sections.filter((section) => section !== entry.section);
      const displayedTopic = isTrue ? entry.section.topic : wrongTopics[(index + seed) % wrongTopics.length].topic;
      return {
        prompt: `True or false: “${entry.fact}” is a characteristic of ${displayedTopic}.`,
        choices: ['True', 'False'],
        answer: isTrue ? 0 : 1,
      };
    }

    if (entry && sections.length > 1) {
      if (index % 2 === 0) {
        const topics = shuffled(sections.map((section) => section.topic), seed + index).slice(0, 4);
        if (!topics.includes(entry.section.topic)) topics[topics.length - 1] = entry.section.topic;
        return {
          prompt: `Which topic from your notes is associated with this characteristic? “${entry.fact}”`,
          choices: topics,
          answer: topics.findIndex((topic) => topic === entry.section.topic),
        };
      }

      const otherFacts = sections
        .filter((section) => section !== entry.section)
        .map((section) => section.facts[(index + seed) % section.facts.length]);
      const choices = shuffled([entry.fact, ...otherFacts], seed + index).slice(0, 4);
      return {
        prompt: `Which characteristic belongs to ${entry.section.topic}?`,
        choices,
        answer: choices.findIndex((fact) => fact === entry.fact),
      };
    }

    const statement = entry?.fact ?? setup.notes.trim();
    const statementWords = statement.split(/\s+/).map(cleanWord).filter((word) => word.length >= 3 && !stopWords.has(word.toLowerCase()));
    const target = statementWords[index % Math.max(statementWords.length, 1)] || words[index % words.length] || 'notes';
    const alternatives = words.filter((word) => word.toLowerCase() !== target.toLowerCase());
    const choices = shuffled([target, ...shuffled(alternatives, seed + index).slice(0, 3)], seed + index + 1);
    return { prompt: `Which word completes this statement from your notes? “${replaceWord(statement, target, '_____')}”`, choices, answer: choices.findIndex((choice) => choice === target) };
  });
}

function readSetup(): QuizSetup | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.sessionStorage.getItem('recall-quiz-setup');
    return saved ? (JSON.parse(saved) as QuizSetup) : null;
  } catch {
    return null;
  }
}

function subscribeToHydration() {
  return () => undefined;
}

export default function QuizPage() {
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const setup = isHydrated ? readSetup() : null;
  const questions = setup ? generateQuestions(setup) : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  if (!setup || questions.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[0_20px_55px_rgb(18_40_32/6%)]">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><FileText className="size-5" /></span>
          <h1 className="mt-5 font-heading text-2xl font-bold tracking-[-0.03em]">Add your notes first</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Your quiz is created entirely from the notes you provide on the previous screen.</p>
          <Button nativeButton={false} render={<Link href="/" aria-label="Go to study notes" />} size="lg" className="mt-6 h-11 rounded-xl px-5">Go to study notes<ArrowRight data-icon="inline-end" /></Button>
        </section>
      </main>
    );
  }

  const question = questions[currentIndex];
  const quizSetup = setup;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = answeredCount === questions.length;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  function chooseAnswer(choiceIndex: number) {
    setAnswers((current) => ({ ...current, [currentIndex]: choiceIndex }));
  }

  function submitQuiz() {
    if (!allAnswered) return;

    const id = window.crypto.randomUUID();
    const completedAt = new Date().toISOString();
    const resultQuestions = questions.map((item, index) => ({
      prompt: item.prompt,
      choices: item.choices,
      correctAnswer: item.answer,
      selectedAnswer: answers[index],
    }));
    const score = resultQuestions.filter((item) => item.correctAnswer === item.selectedAnswer).length;

    saveQuizResult({
      id,
      completedAt,
      score,
      totalQuestions: questions.length,
      difficulty: quizSetup.difficulty,
      questionType: quizSetup.questionType,
      questions: resultQuestions,
    });
    window.location.assign(`/results?id=${encodeURIComponent(id)}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Recall home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BookOpen className="size-4.5" /></span>
            <span className="font-heading text-[1.05rem] font-bold tracking-[-0.025em]">Recall</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
            <RotateCcw className="size-3.5" />Exit quiz
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <section aria-labelledby="quiz-title">
          <div className="mb-8 flex flex-col gap-5 sm:mb-10">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary"><FileText className="size-3.5" />Quiz from your notes</p>
                <h1 id="quiz-title" className="font-heading text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Test what you remember</h1>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold tabular-nums text-muted-foreground shadow-sm">{answeredCount}/{questions.length} answered</span>
            </div>
            <Progress value={progress} aria-label={`Question ${currentIndex + 1} of ${questions.length}`} className="gap-2 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-secondary [&_[data-slot=progress-indicator]]:duration-300" />
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>Question {currentIndex + 1} of {questions.length}</span><span>{Math.round(progress)}% complete</span></div>
          </div>

          <article className="rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(18_40_32/4%),0_20px_55px_rgb(18_40_32/6%)] sm:p-8 lg:p-10">
            <h2 className="max-w-2xl font-heading text-2xl font-bold leading-snug tracking-[-0.025em] sm:text-[1.75rem]">{question.prompt}</h2>
            <fieldset className="mt-8">
              <legend className="sr-only">Choose one answer</legend>
              <div className="grid gap-3">
                {question.choices.map((choice, choiceIndex) => {
                  const selected = answers[currentIndex] === choiceIndex;
                  return (
                    <button key={`${choice}-${choiceIndex}`} type="button" aria-pressed={selected} onClick={() => chooseAnswer(choiceIndex)} className="group flex min-h-16 w-full items-center gap-4 rounded-2xl border border-border bg-background px-4 py-3.5 text-left shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_24px_rgb(18_40_32/8%)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-accent sm:px-5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground transition-colors group-aria-pressed:border-primary group-aria-pressed:bg-primary group-aria-pressed:text-primary-foreground">{selected ? <Check className="size-4" /> : String.fromCharCode(65 + choiceIndex)}</span>
                      <span className="text-sm font-semibold leading-6 sm:text-[0.95rem]">{choice}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </article>

          <nav aria-label="Quiz navigation" className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" size="lg" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} className="h-11 rounded-xl px-4"><ArrowLeft data-icon="inline-start" />Previous</Button>
            {!isLastQuestion ? (
              <Button type="button" size="lg" onClick={() => setCurrentIndex((index) => index + 1)} className="h-11 rounded-xl px-5">Next question<ArrowRight data-icon="inline-end" /></Button>
            ) : (
              <Button type="button" size="lg" disabled={!allAnswered} onClick={submitQuiz} className="h-11 rounded-xl px-5 shadow-[0_10px_25px_rgb(30_94_70/18%)]">Submit quiz<Flag data-icon="inline-end" /></Button>
            )}
          </nav>
          {isLastQuestion && !allAnswered && <p className="mt-4 text-center text-xs text-muted-foreground">Answer every question before submitting. Use Previous to revisit any you skipped.</p>}
        </section>
      </div>
    </main>
  );
}
