import { useMemo } from 'react';
import { EyeOff, Image as ImageIcon, Minus, Plus, UsersRound } from 'lucide-react';
import { heroes, monsters } from '../_shared/battle';
import { fixtureState, geoFor, directorRows, type BattleState } from '../_shared/storyboard/data';
import { FoeMark, FoeTok, HeroMark, HeroTok, InkMap, Labels } from '../_shared/storyboard/map';
import { OnlyYou, Tabs, ModeFrame, themeFor } from '../_shared/storyboard/modes';
import { BuilderShell } from '../_shared/storyboard/builder';
import { directorTools } from '../_shared/storyboard/shell';

// The Battle workspace of the Campaign Builder, Original state: the map as prepared,
// every creature placed and unhurt, nobody acting. Fog shows as the Director's preview.
const g = geoFor(1440, 'director');
const s: BattleState = fixtureState(null, []);
const fresh = heroes.map((h) => ({ ...h, state: 'healthy' as const, conditions: [] }));
const calm = monsters.map((m) => ({ ...m, conditions: [] }));
const ev = [6, 18, 36, 30, 24, 40, 12, 20];

function Map() {
  return (
    <div className="sb-map" style={{ width: g.mapW, height: g.mapH }}>
      <InkMap g={g} role="director" />
      <div className="sb-fogtag" style={{ left: 4.05 * g.cell, top: 2 }}><EyeOff size={14} strokeWidth={2.6} />Hidden from players</div>
      {calm.map((m) => <FoeTok key={m.id} m={m} g={g} s={s} role="director" />)}
      <Labels g={g} role="director" s={s} blockers={[]} riding="" />
      {fresh.map((h) => <HeroTok key={h.id} h={h} g={g} s={s} />)}
    </div>
  );
}

function Thumb() {
  const t = useMemo(() => ({ ...g, mapW: 288, mapH: 144, cell: 288 / 17, first: 9.5 }), []);
  return <div className="bd-thumb"><InkMap g={t} role="director" /></div>;
}

export default function Builder() {
  const total = ev.reduce((a, b) => a + b, 0);
  return (
    <ModeFrame size={1440} theme={themeFor('light')}>
      <BuilderShell g={g} on="battle" leftTab="Initiative"
        left={<>
          <div className="sb-sub sb-sub--dir"><b>Creatures</b><span>EV {total}, Director order</span></div>
          <ul className="bd-groups">
            {directorRows.map((u, i) => (
              <li key={u.name}>
                <FoeMark family={u.family} rank={u.name.startsWith('Ratcrobat') ? 'ratcrobat' : undefined} size={30} />
                <span><b>{u.name}</b><small>{u.count ? `${u.count} creatures` : 'Solo'}</small></span>
                <em>EV {ev[i] ?? 10}</em>
              </li>
            ))}
          </ul>
          <div className="sb-sub sb-sub--dir"><b>Heroes</b><span>Join from the lobby</span></div>
          <div className="bd-party">{fresh.map((h) => <span key={h.id} title={h.label}><HeroMark h={h} size={34} /></span>)}</div>
          <div className="sb-foot"><button className="bd-btn"><Plus size={16} strokeWidth={3} />Group</button><button className="sb-link">Add from Assets</button></div>
        </>}
        right={<>
          <Tabs list={['Audio', 'Map', 'Grid']} on="Map" />
          <Tabs list={['Tokens|25', 'Terrain|3', 'Notes']} on="—" mid />
          <section className="bd-sec">
            <div className="bd-sec__h"><b>Battle map</b><span>17 by 30 squares</span></div>
            <Thumb />
            <div className="bd-kv"><span>File</span><b>ferry-road.png</b></div>
            <button className="bd-btn"><ImageIcon size={16} strokeWidth={2.6} />Browse maps</button>
          </section>
          <section className="bd-sec">
            <div className="bd-sec__h"><b>Fog</b><OnlyYou /></div>
            <p>One zone over the north bank. Players see it black until you clear it.</p>
          </section>
          <section className="bd-sec">
            <div className="bd-sec__h"><b>Party</b><span><UsersRound size={14} strokeWidth={2.6} style={{ verticalAlign: -2 }} /> 7 heroes</span></div>
            <p>Heroes start on the south trail. They join from the lobby.</p>
          </section>
          <section className="bd-sec bd-grow">
            <div className="bd-sec__h"><b>Director notes</b><OnlyYou /></div>
            <p>Ajax holds back until a hero reaches the sword. Ashen Hoarder flees at half stamina and drops the key to the ferry chain.</p>
          </section>
        </>}
        map={<Map />}
        bar={
          <div className="sb-bar">
            <div className="sb-tools" role="toolbar" aria-label="Map tools">{directorTools.map((t) => <span key={t} data-on={t === 'Select' || undefined}>{t}</span>)}</div>
            <div className="sb-roll" role="toolbar" aria-label="Zoom"><span><Minus size={14} strokeWidth={3} /></span><span>100%</span><span><Plus size={14} strokeWidth={3} /></span><span>Grid on</span></div>
          </div>
        } />
    </ModeFrame>
  );
}
