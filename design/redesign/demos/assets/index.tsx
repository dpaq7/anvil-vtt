import type { ReactNode } from 'react';
import { BookOpen, ChevronDown, CircleDashed, Image as ImageIcon, Map as MapIcon, Mountain, Music, Pencil, Plus, Skull, Swords, UserRound, UsersRound } from 'lucide-react';
import { AppShell, AppStage, Btn, PageHead } from '../_shared/storyboard/app';
import { geoFor } from '../_shared/storyboard/data';
import { InkMap } from '../_shared/storyboard/map';
import { themeFor } from '../_shared/storyboard/modes';
import { MontageArt, NegotiationArt, RespiteArt, StoryArt } from '../_shared/storyboard/scene-art';
import './assets.css';

// Assets, Maps. The Director's library, filtered to one campaign. Every map shows its
// art, its name and where it is used; the one selected opens on the right. One upload
// is still running, drawn in the states sheet's loading look: hatched, in the shape of
// what is coming, saying what it is. All map art is placeholder drawn in code.
const W = 310, H = 196;
const battle = { ...geoFor(1440, 'director'), mapW: W, mapH: H, cell: W / 17, first: 10 };
const big = { ...battle, mapW: 288, mapH: 210, cell: 288 / 17, first: 9 };

const cats: { name: string; n: number; icon: typeof MapIcon; on?: boolean }[] = [
  { name: 'Heroes', n: 7, icon: UserRound }, { name: 'NPCs', n: 5, icon: UsersRound }, { name: 'Pictures', n: 12, icon: ImageIcon },
  { name: 'Maps', n: 6, icon: MapIcon, on: true }, { name: 'Bestiary', n: 439, icon: Skull }, { name: 'Terrain', n: 35, icon: Mountain }, { name: 'Audio', n: 9, icon: Music },
];

type Tile = { name: string; used: string; art: ReactNode; on?: boolean };
const tiles: Tile[] = [
  { name: 'Ferry road', used: 'Get the Sword!', art: <InkMap g={battle} role="director" />, on: true },
  { name: 'Drowned chapel', used: 'Smoke Story Beat', art: <StoryArt w={W} h={H} /> },
  { name: 'Swamp crossing', used: 'A Chase Through a Trap…', art: <MontageArt w={W} h={H} /> },
  { name: 'Thief’s parlour', used: 'Negotiation with a Thief', art: <NegotiationArt w={W} h={H} /> },
  { name: 'Ferry camp', used: 'Smoke Respite', art: <RespiteArt w={W} h={H} /> },
];

function Card({ t }: { t: Tile }) {
  return (
    <article className="as-tile" data-on={t.on || undefined}>
      <div className="as-art">{t.art}</div>
      <div className="as-cap"><b>{t.name}</b><small>In {t.used}</small></div>
    </article>
  );
}

export default function Assets() {
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="director" on="assets">
        <PageHead title="Assets" sub="Maps, art, creatures and sound for one campaign at a time."
          actions={<>
            <Btn icon={<BookOpen size={17} strokeWidth={2.4} />}>The Sunken Bells of Marrowmere<ChevronDown size={17} strokeWidth={2.6} /></Btn>
            <Btn kind="go" icon={<Plus size={18} strokeWidth={3} />}>Upload map</Btn>
          </>} />
        <div className="ap-page as-page">
          <ul className="as-cats" aria-label="Kinds">
            {cats.map(({ name, n, icon: I, on }) => <li key={name} data-on={on || undefined}>{on && <i className="as-mark" aria-hidden />}<I size={19} strokeWidth={2.4} /><span>{name}</span><em>{n}</em></li>)}
            <li className="as-store"><span>Storage</span><b>164 MB used</b><i className="sb-meter"><u style={{ width: '33%' }} /></i><small>Maps 38 MB, audio 112 MB, pictures 14 MB</small></li>
          </ul>
          <section className="as-grid">
            <div className="as-row">{tiles.slice(0, 2).map((t) => <Card key={t.name} t={t} />)}</div>
            <div className="as-row">{tiles.slice(2, 4).map((t) => <Card key={t.name} t={t} />)}</div>
            <div className="as-row">
              {tiles.slice(4).map((t) => <Card key={t.name} t={t} />)}
              <article className="as-tile as-up" aria-busy>
                <div className="as-art as-art--up"><CircleDashed size={26} strokeWidth={2.6} /><b>Uploading, 64%</b><i className="sb-meter"><u style={{ width: '64%' }} /></i></div>
                <div className="as-cap"><b>bell-tower-inside.png</b><small>18.2 MB of 28.4 MB</small></div>
              </article>
            </div>
          </section>
          <aside className="as-detail">
            <div className="as-big"><InkMap g={big} role="director" /></div>
            <div className="as-d">
              <h2>Ferry road</h2>
              <dl>
                <div><dt>Grid</dt><dd>17 by 30 squares</dd></div>
                <div><dt>File</dt><dd>ferry-road.png, 6.1 MB</dd></div>
                <div><dt>Used in</dt><dd><span className="as-scene"><Swords size={14} strokeWidth={2.6} /></span>Get the Sword!</dd></div>
                <div><dt>Added</dt><dd>Oct 29</dd></div>
              </dl>
              <div className="as-acts">
                <Btn kind="go" icon={<Plus size={17} strokeWidth={3} />}>Add to scene</Btn>
                <Btn icon={<Pencil size={16} strokeWidth={2.6} />}>Edit details</Btn>
              </div>
            </div>
          </aside>
        </div>
      </AppShell>
    </AppStage>
  );
}
