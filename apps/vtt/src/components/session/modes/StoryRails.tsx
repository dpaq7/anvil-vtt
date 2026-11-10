import { useEffect, useState } from 'react';
import { AudioLines } from 'lucide-react';
import { cleanName } from '../../../lib/faces.js';
import { usePlayerVolume } from '../../../lib/mode-prefs.js';
import type { AudioLiveState, EntityData } from '../../../types/protocol.js';
import { TokenFace } from '../battle/TokenFace.js';
import { useSessionConnection } from '../shell/connection-context.js';
import { Head, OnlyYou } from './parts.js';

/** People in a scene, beside the party. A hidden one is hatched for the Director and absent for anyone else. */
export function SceneNpcs({ npcs, hiddenIds, isDirector }: { npcs: EntityData[]; hiddenIds?: Set<string>; isDirector: boolean }) {
  return (
    <>
      <Head title="In this scene" note={`${npcs.length} ${npcs.length === 1 ? 'person' : 'people'}`} />
      {npcs.length === 0 && <p className="sb-note md-pad">Nobody else is here.</p>}
      {npcs.map((npc) => {
        const hidden = hiddenIds?.has(npc.id) ?? false;
        const kind = npc.type === 'npc' ? 'NPC' : 'Creature';
        // The stat block's name is the Director's: a renamed NPC must not show what it really is.
        const statBlock = isDirector && typeof npc['monsterName'] === 'string' && npc['monsterName'] !== npc.name ? (npc['monsterName'] as string) : null;
        const note = statBlock ?? kind;
        return (
          <div key={npc.id} className="md-npc" data-hidden={hidden || undefined}>
            <TokenFace entity={npc} size={32} />
            <div className="sb-who">
              <strong><span>{cleanName(npc.name)}</span></strong>
              <small>{note}</small>
            </div>
            {hidden && <OnlyYou>Hidden</OnlyYou>}
          </div>
        );
      })}
    </>
  );
}

/** Director notes: the Director's alone (`md-only`). */
export function DirectorNotes({ title = 'Director notes', notes }: { title?: string; notes: string }) {
  const parts = notes.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      <Head title={title} note={<OnlyYou />} />
      <div className="md-notes">
        {parts.length === 0 ? <p className="text-text-soft">No notes for this scene.</p> : parts.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </>
  );
}

/** The Player's own sound: what the Director plays, and a volume that changes this browser only. */
export function PlayerSound({ audio }: { audio: AudioLiveState | null }) {
  const [volume, setVolume] = usePlayerVolume();
  const playing = Boolean(audio?.playing && audio.assetName);
  return (
    <>
      <Head title="Sound" note="From the Director" />
      <div className="md-sound">
        <AudioLines size={20} strokeWidth={2.6} aria-hidden="true" />
        <div>
          <b>{playing ? audio?.assetName : 'Nothing playing'}</b>
          <small>{playing ? (audio?.loop ? 'Looping' : 'Playing') : 'The Director starts the sound'}</small>
        </div>
        <label>
          <span>Your volume, {Math.round(volume * 100)}%</span>
          <input type="range" min={0} max={100} step={5} value={Math.round(volume * 100)} onChange={(e) => setVolume(Number(e.target.value) / 100)} aria-label="Your volume" />
        </label>
      </div>
    </>
  );
}

/** The Director's read-aloud editor, at the top of the right rail (`story-director`). */
export function ReadAloudEditor({ text, onUpdate }: { text: string; onUpdate: (text: string) => void }) {
  const { paused } = useSessionConnection();
  const [draft, setDraft] = useState(text);
  useEffect(() => setDraft(text), [text]);
  const changed = draft !== text;
  return (
    <section className="sb-sec md-edit">
      <div className="md-tool__h">
        <b>Read-aloud</b>
        <span>
          {paused ? 'Update when back' : changed ? 'Not sent yet' : 'No changes'}
          <button type="button" className="md-btn" disabled={!changed || paused} onClick={() => onUpdate(draft)}>
            Update
          </button>
        </span>
      </div>
      <textarea className="md-textarea" aria-label="Read-aloud text" value={draft} onChange={(e) => setDraft(e.target.value)} />
    </section>
  );
}
