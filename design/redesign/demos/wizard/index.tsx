import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import { AppShell, AppStage, Btn, PageHead } from '../_shared/storyboard/app';
import { HeroFace } from '../_shared/storyboard/faces';
import { themeFor } from '../_shared/storyboard/modes';
import './wizard.css';

// The hero wizard, step 5: class. Steps are a real sequence, so they are numbered down
// the left; the choice is a grid of drawn heads, one per class (Gate 1's known cost:
// every class gets a head); the hero so far builds up on the right. Class lines are
// invented placeholders, not rules text. The Forge Steel upload keeps its place in the
// step, as the twelfth tile.
const INK = '#15171c';
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const eyes = (y: number, gap = 7) => <g fill={INK}><circle cx={32 - gap} cy={y} r="3.2" /><circle cx={32 + gap} cy={y} r="3.2" /></g>;

// Four heads the fixture has no hero for. Placeholder art in the same ink style.
function NewHead({ kind, size }: { kind: 'fury' | 'null' | 'talent' | 'summoner'; size: number }) {
  const art = {
    fury: <>
      <path {...line} fill="#d6372c" d="M10 30L2 8l14 8L20-2l10 12L38-2l6 14 14-6-6 22Z" />
      <circle {...line} cx="32" cy="38" r="20" fill="#e7b58c" />
      <path {...line} strokeWidth="3.4" fill="none" d="M20 30l9 4M44 30l-9 4M25 49q7-5 14 0" />
      {eyes(38, 8)}
    </>,
    null: <>
      <ellipse {...line} cx="32" cy="34" rx="21" ry="25" fill="#c9b6a0" />
      <circle cx="32" cy="18" r="3.5" fill="#2b6fe6" stroke={INK} strokeWidth="2" />
      <path {...line} strokeWidth="3.2" fill="none" d="M20 34q5 3 9 0M35 34q5 3 9 0M27 47h10" />
    </>,
    talent: <>
      <path {...line} fill="#1f9d8a" d="M32 0Q60 6 58 40q-2 20-26 22Q6 60 6 40 4 6 32 0Z" />
      <circle {...line} cx="32" cy="38" r="15" fill="#f2c79a" />
      <path {...line} strokeWidth="3" fill="#ffd21f" d="M32 12l4 6-4 6-4-6Z" />
      {eyes(37, 6)}<path {...line} strokeWidth="3" fill="none" d="M28 45h8" />
    </>,
    summoner: <>
      <path {...line} fill="#3d4a7a" d="M32 2l22 24q6 24-6 34H16Q4 50 10 26Z" />
      <circle {...line} cx="32" cy="38" r="13" fill="#f6d8bd" />
      {eyes(37, 5.5)}
      <circle {...line} strokeWidth="3" cx="56" cy="8" r="6" fill="#9db4ff" />
    </>,
  };
  return <svg width={size} height={size} viewBox="-7 -7 78 78" aria-hidden>{art[kind]}</svg>;
}

type Cls = { name: string; line: string; who?: string; head?: 'fury' | 'null' | 'talent' | 'summoner' };
const classes: Cls[] = [
  { name: 'Beastheart', who: 'Smoke', line: 'Fights side by side with a wild companion.' },
  { name: 'Censor', who: 'Torvald', line: 'Hunts the wicked and judges them on the spot.' },
  { name: 'Conduit', who: 'Dovrin', line: 'Carries a god’s favour into every fight.' },
  { name: 'Elementalist', who: 'Ysolde', line: 'Bends fire, stone and green growing things.' },
  { name: 'Fury', head: 'fury', line: 'Hits hardest when the fight goes badly.' },
  { name: 'Null', head: 'null', line: 'Stays calm while the world bends around them.' },
  { name: 'Shadow', who: 'Wren', line: 'Strikes from where nobody is looking.' },
  { name: 'Summoner', head: 'summoner', line: 'Calls helpers to the field and sends them in.' },
  { name: 'Tactician', who: 'Ilsabet', line: 'Reads the fight and moves the party through it.' },
  { name: 'Talent', head: 'talent', line: 'Moves things with the mind, at a cost.' },
  { name: 'Troubadour', who: 'Pip', line: 'Turns every fight into a performance.' },
];
const steps = ['Level', 'Ancestry', 'Culture', 'Career', 'Class', 'Subclass', 'Complication', 'Characteristics', 'Kit', 'Skills', 'Languages', 'Perks', 'Titles', 'Abilities', 'Personal', 'Review'];
const NOW = 4;

function Head({ c, size }: { c: Cls; size: number }) {
  return c.who ? <HeroFace who={c.who} size={size} /> : <NewHead kind={c.head!} size={size} />;
}

export default function Wizard() {
  const pick = classes[0];
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="player" on="heroes">
        <PageHead title="New hero" sub="Step 5 of 16. Pick a class. You can change it until you finish."
          actions={<>
            <Btn icon={<ArrowLeft size={17} strokeWidth={3} />}>Back</Btn>
            <Btn kind="go">Next: Subclass<ArrowRight size={18} strokeWidth={3} /></Btn>
          </>} />
        <div className="ap-page wz-page">
          <div className="wz-rail">
          <ol className="wz-steps" aria-label="Steps">
            {steps.map((s, i) => (
              <li key={s} data-state={i < NOW ? 'done' : i === NOW ? 'now' : undefined} aria-current={i === NOW ? 'step' : undefined}>
                <b>{i < NOW ? <Check size={15} strokeWidth={3.5} /> : i + 1}</b><span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="wz-done"><span><b>4 of 16</b> steps done</span><i className="sb-meter"><u style={{ width: '25%' }} /></i></div>
          </div>
          <section className="wz-main">
            <div className="wz-grid" role="radiogroup" aria-label="Class">
              {classes.map((c) => (
                <div key={c.name} className="wz-cls" role="radio" tabIndex={c === pick ? 0 : -1} aria-checked={c === pick} data-on={c === pick || undefined}>
                  <span className="wz-head"><Head c={c} size={52} /></span>
                  <span className="wz-t"><b>{c.name}</b><small>{c.line}</small></span>
                </div>
              ))}
              <div className="wz-import">
                <b>Already have a complete hero?</b>
                <small>Upload a Forge Steel file and skip the steps.</small>
                <Btn icon={<Upload size={16} strokeWidth={2.4} />}>Upload .ds-hero</Btn>
              </div>
            </div>
          </section>
          <aside className="wz-prev">
            <div className="wz-prev__f"><Head c={pick} size={92} /></div>
            <h2>Your hero so far</h2>
            <dl>
              <div><dt>Level</dt><dd>1</dd></div>
              <div><dt>Ancestry</dt><dd>Human</dd></div>
              <div><dt>Culture</dt><dd>Wilderness, communal</dd></div>
              <div><dt>Career</dt><dd>Criminal</dd></div>
              <div data-new><dt>Class</dt><dd>{pick.name}</dd></div>
              <div data-next><dt>Subclass</dt><dd>Next step</dd></div>
              <div data-next><dt>Name</dt><dd>Step 15</dd></div>
            </dl>
          </aside>
        </div>
      </AppShell>
    </AppStage>
  );
}
