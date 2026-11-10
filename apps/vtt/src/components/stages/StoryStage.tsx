import { Eye, Volume2 } from 'lucide-react';
import { Side } from '../session/modes/parts.js';
import { paragraphs } from './mode-helpers.js';

interface StoryStageProps {
  readAloudText?: string;
  /** Kept for the Builder's preview. Notes are Director-only and live in the rail, never on the page. */
  directorNotes?: string;
  isDirector: boolean;
  /** The scene's name, set as the page's slug. */
  slug?: string;
  directorName?: string | null;
  /** Hide the corner tracker (the Display draws its own). */
  bare?: boolean;
}


/** The read-aloud set like a page of script, bound at the left (`story-*`, `md-page`). */
export function ScriptPage({ text, slug, className = 'md-page' }: { text: string; slug?: string; className?: string }) {
  const parts = paragraphs(text);
  return (
    <article className={className} aria-label="Read-aloud">
      <i className="md-holes" aria-hidden="true">
        <u />
        <u />
        <u />
      </i>
      {slug && <h3 className={className === 'md-page' ? 'md-slug' : 'dp-slug'}>{slug}</h3>}
      {parts.length > 0 ? parts.map((part, index) => <p key={index}>{part}</p>) : <p>No read-aloud for this scene yet.</p>}
    </article>
  );
}

/** Story's screen: the scene art, the corner note, the script page (DESIGN.md section 6). */
export function StoryStage({ readAloudText, isDirector, slug, directorName, bare = false }: StoryStageProps) {
  return (
    <>
      {!bare && (
        <Side
          items={[
            isDirector
              ? { label: <><Eye size={15} strokeWidth={2.6} aria-hidden="true" />Players see this page</> }
              : { label: <><Volume2 size={15} strokeWidth={2.6} aria-hidden="true" />Read by {directorName ?? 'the Director'}</> },
          ]}
        />
      )}
      <ScriptPage text={readAloudText ?? ''} slug={slug} />
    </>
  );
}
