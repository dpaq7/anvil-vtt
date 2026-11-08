import { ArrowLeft, ImagePlus, Star } from 'lucide-react';
import { heroes } from '../_shared/battle';
import { AppShell, AppStage, Btn, PageHead } from '../_shared/storyboard/app';
import { HeroMark } from '../_shared/storyboard/map';
import { themeFor } from '../_shared/storyboard/modes';
import { Meter } from '../_shared/storyboard/rails';
import './sheet.css';

// The hero sheet, which the audit called the best screen in the app: strong hierarchy,
// the hero first. Kept: the hero band, the vitals, characteristics, then tabs. The face
// is the token's own drawn head. Ability names and lines are invented placeholders;
// no rules text is reproduced.
const smoke = heroes[0];
const traits = [['Might', 'MIG', '+2'], ['Agility', 'AGI', '+2'], ['Reason', 'REA', '−1'], ['Intuition', 'INT', '+2'], ['Presence', 'PRE', '−1']];
const tabs = ['Class', 'Skills', 'Abilities', 'Kit', 'Inventory', 'Background', 'Traits', 'Perks'];

type Ability = { name: string; kind: string; cost?: string; tags: string[]; reach: string; line: string; tiers: [string, string, string] };
const abilities: Ability[] = [
  { name: 'Snap and Hold', kind: 'Main action', tags: ['Melee', 'Strike', 'Weapon'], reach: 'Melee 1, one creature', line: 'Placeholder. Your companion pins a foe while you strike.', tiers: ['3 damage', '6 damage', '9 damage, grabbed'] },
  { name: 'Pack Charge', kind: 'Main action', cost: '3 Ferocity', tags: ['Charge', 'Melee', 'Strike'], reach: 'Melee 1, one creature', line: 'Placeholder. You and your companion close the gap as one.', tiers: ['4 damage', '7 damage', '10 damage, prone'] },
  { name: 'Hackles Up', kind: 'Maneuver', tags: ['Area'], reach: '2 burst, each enemy', line: 'Placeholder. A low growl makes nearby foes think twice.', tiers: ['No effect', 'Slowed', 'Slowed, taunted'] },
  { name: 'Into the Brush', kind: 'Move action', tags: ['Movement'], reach: 'Self', line: 'Placeholder. You drop out of sight and come up somewhere else.', tiers: ['Shift 2', 'Shift 3', 'Shift 4, hidden'] },
  { name: 'Bristle', kind: 'Triggered', tags: ['Melee'], reach: 'Melee 1, the attacker', line: 'Placeholder. When struck, your companion snaps back.', tiers: ['2 damage', '4 damage', '6 damage'] },
  { name: 'Howl at the Gap', kind: 'Main action', cost: '5 Ferocity', tags: ['Area', 'Magic'], reach: '3 cube within 5', line: 'Placeholder. The howl shakes loose stones and nerves.', tiers: ['3 damage', '5 damage, frightened', '8 damage, frightened'] },
];

export default function HeroSheet() {
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="player" on="heroes">
        <PageHead title={smoke.label} sub={`Level ${smoke.level} ${smoke.heroClass}, ${smoke.ancestry}. Playing in The Sunken Bells of Marrowmere.`}
          actions={<>
            <Btn kind="quiet" icon={<ArrowLeft size={16} strokeWidth={3} />}>All heroes</Btn>
            <Btn disabled icon={<Star size={17} strokeWidth={2.6} />}>Advance to level 2</Btn>
          </>} />
        <div className="ap-page hs-page">
          <aside className="hs-side">
            <div className="hs-face">
              <i className="hs-hatch" aria-hidden />
              <div className="hs-face__f"><HeroMark h={smoke} size={150} /></div>
              <button className="hs-up" aria-label="Upload portrait"><ImagePlus size={20} strokeWidth={2.4} /></button>
            </div>
            <section className="hs-sec">
              <div className="hs-vital"><span>Stamina</span><b>{smoke.max} / {smoke.max}</b><Meter cur={smoke.max} max={smoke.max} /></div>
              <dl className="hs-kv">
                <div><dt>Recoveries</dt><dd>{smoke.recoveriesMax} / {smoke.recoveriesMax}</dd></div>
                <div><dt>{smoke.resourceName}</dt><dd>0</dd></div>
                <div><dt>Victories</dt><dd>0</dd></div>
                <div><dt>XP</dt><dd>0</dd></div>
              </dl>
            </section>
            <section className="hs-sec">
              <h3>Characteristics</h3>
              <ul className="hs-traits">{traits.map(([n, a, v]) => <li key={a} title={n}><small>{a}</small><b>{v}</b></li>)}</ul>
            </section>
            <section className="hs-sec">
              <h3>In a fight</h3>
              <dl className="hs-kv hs-kv--3"><div><dt>Speed</dt><dd>{smoke.speed}</dd></div><div><dt>Size</dt><dd>1M</dd></div><div><dt>Stability</dt><dd>1</dd></div></dl>
            </section>
            <section className="hs-sec hs-grow">
              <h3>Who they are</h3>
              <dl className="hs-id">
                <div><dt>Ancestry</dt><dd>{smoke.ancestry}</dd></div>
                <div><dt>Culture</dt><dd>Wilderness, communal</dd></div>
                <div><dt>Career</dt><dd>Criminal</dd></div>
              </dl>
            </section>
          </aside>
          <section className="hs-main">
            <nav className="sb-tabs hs-tabs" aria-label="Sheet">{tabs.map((t) => <span key={t} data-on={t === 'Abilities' || undefined}>{t}</span>)}</nav>
            <div className="hs-abs">
              {abilities.map((a) => (
                <article key={a.name} className="hs-ab">
                  <header><h4>{a.name}</h4><span className="hs-kind" data-kind={a.kind.split(' ')[0]}>{a.kind}</span></header>
                  <p className="hs-meta">{a.cost && <b>{a.cost}. </b>}{a.reach}</p>
                  <p>{a.line}</p>
                  <div className="hs-tags">{a.tags.map((t) => <span key={t} className="ap-tag">{t}</span>)}</div>
                  <ol className="hs-tiers">
                    {a.tiers.map((t, i) => <li key={i}><small>{['11 or less', '12 to 16', '17 or more'][i]}</small><b>{t}</b></li>)}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    </AppStage>
  );
}
