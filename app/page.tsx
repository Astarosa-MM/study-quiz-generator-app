'use client';
/* eslint-disable jsx-a11y/prefer-tag-over-role -- The rich-text editor requires contenteditable textbox semantics. */

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bold, BookOpen, Check, CircleHelp, Gauge, History, Italic, List, ListChecks, ListOrdered, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState('');
  const [quizLength, setQuizLength] = useState(10);
  const [questionType, setQuestionType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const canGenerate = notes.trim().length >= 20;

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (canGenerate) {
      const quizSeed = window.crypto.getRandomValues(new Uint32Array(1))[0];
      window.sessionStorage.setItem('recall-quiz-setup', JSON.stringify({ notes, quizLength, questionType, difficulty, quizSeed }));
      window.location.assign('/quiz');
    }
  }

  function syncNotes() {
    setNotes(editorRef.current?.innerText ?? '');
    setShowConfirmation(false);
  }

  function formatInline(tag: 'strong' | 'em') {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.addRange(nextRange);
    syncNotes();
  }

  function formatList(tag: 'ul' | 'ol') {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    const list = document.createElement(tag);
    const lines = selectedText ? selectedText.split(/\n+/) : [''];
    for (const line of lines) {
      const item = document.createElement('li');
      item.textContent = line;
      list.appendChild(item);
    }
    range.deleteContents();
    range.insertNode(list);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(list.lastElementChild ?? list);
    nextRange.collapse(false);
    selection.addRange(nextRange);
    syncNotes();
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Backspace') return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const anchor = selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement;
    const listItem = anchor?.closest('li');
    const editor = editorRef.current;

    if (!editor || !anchor) return;

    if (!listItem || !editor.contains(listItem)) {
      const block = anchor.closest<HTMLElement>('div, p, blockquote');
      if (!block || block === editor || !editor.contains(block)) return;

      const contentBeforeCaret = document.createRange();
      contentBeforeCaret.selectNodeContents(block);
      contentBeforeCaret.setEnd(range.startContainer, range.startOffset);
      if (contentBeforeCaret.toString().length > 0) return;

      const styles = window.getComputedStyle(block);
      const isIndented = block.tagName === 'BLOCKQUOTE'
        || Number.parseFloat(styles.marginLeft) > 0
        || Number.parseFloat(styles.paddingLeft) > 0
        || Number.parseFloat(styles.textIndent) > 0;
      if (!isIndented) return;

      event.preventDefault();
      const paragraph = block.tagName === 'BLOCKQUOTE' ? document.createElement('div') : block;
      if (paragraph !== block) {
        while (block.firstChild) paragraph.appendChild(block.firstChild);
        block.replaceWith(paragraph);
      }
      paragraph.style.setProperty('margin-left', '0', 'important');
      paragraph.style.setProperty('padding-left', '0', 'important');
      paragraph.style.setProperty('text-indent', '0', 'important');

      const nextRange = document.createRange();
      nextRange.selectNodeContents(paragraph);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      syncNotes();
      return;
    }

    const contentBeforeCaret = document.createRange();
    contentBeforeCaret.selectNodeContents(listItem);
    contentBeforeCaret.setEnd(range.startContainer, range.startOffset);
    if (contentBeforeCaret.toString().length > 0) return;

    event.preventDefault();
    const list = listItem.parentElement;
    const paragraph = document.createElement('div');
    while (listItem.firstChild) paragraph.appendChild(listItem.firstChild);
    if (!paragraph.hasChildNodes()) paragraph.appendChild(document.createElement('br'));
    list?.parentNode?.insertBefore(paragraph, list.nextSibling);
    listItem.remove();
    if (list && list.children.length === 0) list.remove();

    const nextRange = document.createRange();
    nextRange.selectNodeContents(paragraph);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    syncNotes();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#main-content" className="flex items-center gap-3" aria-label="Recall home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BookOpen className="size-4.5" aria-hidden="true" /></span>
            <span className="font-heading text-[1.05rem] font-bold tracking-[-0.025em]">Recall</span>
          </a>
          <Link href="/history" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"><History className="size-3.5" />Quiz history</Link>
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
                  <Label id="study-notes-label" className="text-[0.95rem] font-bold">Your study notes</Label>
                  <p id="notes-help" className="mt-1.5 text-sm text-muted-foreground">Definitions, lecture notes, or a chapter summary all work well.</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{notes.length.toLocaleString()} characters</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(18_40_32/4%),0_12px_35px_rgb(18_40_32/4%)] focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
                <div className="flex items-center gap-1 border-b border-border bg-muted/45 px-3 py-2" role="toolbar" aria-label="Text formatting">
                  <button type="button" aria-label="Bold" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => formatInline('strong')} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><Bold className="size-4" /></button>
                  <button type="button" aria-label="Italic" title="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => formatInline('em')} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><Italic className="size-4" /></button>
                  <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
                  <button type="button" aria-label="Bulleted list" title="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => formatList('ul')} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><List className="size-4" /></button>
                  <button type="button" aria-label="Numbered list" title="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => formatList('ol')} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><ListOrdered className="size-4" /></button>
                </div>
                <div
                  ref={editorRef}
                  id="study-notes"
                  role="textbox"
                  tabIndex={0}
                  aria-multiline="true"
                  aria-labelledby="study-notes-label"
                  aria-describedby="notes-help"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Paste your notes here…"
                  onInput={syncNotes}
                  onKeyDown={handleEditorKeyDown}
                  className="min-h-64 resize-y overflow-auto p-5 text-[0.95rem] leading-7 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground/60 empty:before:content-[attr(data-placeholder)] sm:min-h-72 [&_*]:!text-[0.95rem] [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-bold [&_em]:italic"
                />
              </div>
            </div>

            <fieldset>
              <legend className="text-[0.95rem] font-bold">Quiz length</legend>
              <p className="mt-1.5 text-sm text-muted-foreground">How many questions would you like?</p>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
                {quizLengths.map((length) => <button key={length} type="button" aria-pressed={quizLength === length} onClick={() => setQuizLength(length)} className="rounded-xl border border-border bg-card px-3 py-3 text-sm font-bold shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out will-change-transform hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_28px_rgb(18_40_32/10%)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-primary">{length} questions</button>)}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[0.95rem] font-bold">Question type</legend>
              <p className="mt-1.5 text-sm text-muted-foreground">Pick the format that helps you learn best.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {questionTypes.map(({ value, label, description, icon: Icon }) => {
                  const selected = questionType === value;
                  return <button key={value} type="button" aria-pressed={selected} onClick={() => setQuestionType(value)} className="group relative rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out will-change-transform hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_28px_rgb(18_40_32/10%)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-accent">
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
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {difficulties.map(({ value, label, description }) => {
                  const selected = difficulty === value;
                  return <button key={value} type="button" aria-pressed={selected} onClick={() => setDifficulty(value)} className="relative w-full rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out will-change-transform hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_28px_rgb(18_40_32/10%)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-accent">
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
