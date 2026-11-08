// The states sheet: reconnect, loading, empty and failure, in the Storyboard language.
// Rules it shows:
// - A short drop never hides the table. It says so in the status bar and on the screen's
//   edge, and only the action that needs the server waits.
// - Loading is drawn in the shape of what is coming, hatched like work in progress, and
//   says what it is loading. Empty is drawn as an open slot with one thing to do.
// - Every failure says what happened in plain words and offers a way forward.
// Everything here is display: the buttons are the app's existing routes and reloads.
import '../still.css';
import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, CircleDashed, Footprints, Handshake, Home, Laptop, Plus, RefreshCw, Smartphone, Swords, Tent, Unplug, WifiOff } from 'lucide-react';
import { Stage, type Theme } from '../../../kit';
import { PlayerBoard } from './screens';
import { PhoneApp, PlayerBattle, TabBar } from './phone';
import { themeFor } from './modes';
import './modes.css';
import './phone.css';
import './states.css';

export const SHEET = { w: 1440, h: 3535 };

// ---- Reconnect --------------------------------------------------------------------
function DropStrip({ secs }: { secs: number }) {
  return (
    <div className="st-drop" role="status">
      <i><WifiOff size={18} strokeWidth={2.6} /></i>
      <b>Reconnecting…</b>
      <span>The table is as it was {secs} seconds ago. You can keep reading it.</span>
    </div>
  );
}

function ShortDrop({ theme }: { theme: Theme }) {
  return (
    <div className="st-board">
      <PlayerBoard size={1440} theme={theme}
        link={<span className="st-link"><Unplug size={13} strokeWidth={3} />Reconnecting, 4 s</span>}
        take={<button className="sb-take st-take" disabled>Take my turn, when back</button>}
        overlay={<DropStrip secs={4} />} />
    </div>
  );
}

// ---- Small screens ------------------------------------------------------------------
function Tile({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <figure className="st-tile">
      <figcaption><b>{title}</b><span>{note}</span></figcaption>
      {children}
    </figure>
  );
}

// A failure, loading or empty page in the sheet's comic-page grid: what it is, then the page.
function Panel({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <figure className="st-panel">
      <figcaption><b>{title}</b><span>{note}</span></figcaption>
      <div className="st-page__b">{children}</div>
    </figure>
  );
}

function Problem({ icon, title, body, go, alt }: { icon: ReactNode; title: string; body: string; go: ReactNode; alt?: ReactNode }) {
  return (
    <div className="st-msg">
      <i>{icon}</i>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="st-acts"><button className="st-go">{go}</button>{alt && <button className="st-alt">{alt}</button>}</div>
    </div>
  );
}

// Loading: the shape of the list that is coming, hatched like a page still being inked.
function LoadingList() {
  return (
    <div className="st-load">
      <div className="st-load__h"><CircleDashed size={18} strokeWidth={2.6} /><b>Loading your campaigns…</b></div>
      {[0, 1, 2].map((i) => (
        <div className="st-ghost" key={i}>
          <i />
          <div><u style={{ width: ['62%', '48%', '70%'][i] }} /><u style={{ width: ['38%', '30%', '44%'][i] }} /></div>
        </div>
      ))}
    </div>
  );
}

// Empty: a Film Strip with nothing on it yet, and the one thing to do.
function EmptyList() {
  const icons = [BookOpen, Footprints, Handshake, Swords, Tent];
  return (
    <div className="st-empty">
      <div className="st-strip" aria-hidden>{icons.map((I, i) => <span key={i} data-i={i}><I size={20} strokeWidth={2.6} /></span>)}</div>
      <h2>No campaigns yet</h2>
      <p>A campaign holds your scenes, heroes and maps. Make one to start a session.</p>
      <div className="st-acts"><button className="st-go"><Plus size={17} strokeWidth={3} />Create campaign</button><button className="st-alt">Import campaign</button></div>
    </div>
  );
}

function LoadingSession() {
  return (
    <div className="st-sess">
      <div className="st-sess__top"><b>Anvil</b>{[0, 1, 2, 3, 4].map((i) => <span key={i} />)}</div>
      <div className="st-sess__mid">
        <div className="st-rail">{[0, 1, 2, 3, 4].map((i) => <u key={i} />)}</div>
        <div className="st-screen"><CircleDashed size={26} strokeWidth={2.6} /><b>Opening the table…</b><span>Scenes, heroes and the map</span></div>
      </div>
    </div>
  );
}

// ---- Phone ------------------------------------------------------------------------
function PhoneLocked() {
  return (
    <div className="ph-app st-lock">
      <div className="st-lock__art" aria-hidden>
        <span className="st-lock__laptop"><Laptop size={64} strokeWidth={2} /></span>
        <span className="st-lock__phone"><Smartphone size={44} strokeWidth={2.2} /></span>
      </div>
      <h2>Open this table on your laptop first</h2>
      <p>The phone works beside a laptop or tablet signed in to the same account.</p>
      <ol>
        <li><b>1</b><span>On your laptop, open this session.</span></li>
        <li><b>2</b><span>Keep this phone open. It unlocks by itself.</span></li>
      </ol>
      <div className="st-wait" role="status"><i />Waiting for your laptop…</div>
    </div>
  );
}

function PhoneLoading() {
  return (
    <PhoneApp role="player" mode="battle">
      <div className="ph-top"><div className="sb-word">Anvil</div><div className="st-ghostboard" /></div>
      <div className="ph-body st-phload">
        <div className="st-load__h"><CircleDashed size={18} strokeWidth={2.6} /><b>Loading your hero…</b></div>
        {[0, 1, 2, 3].map((i) => <div className="st-ghost" key={i}><i /><div><u style={{ width: ['70%', '52%', '64%', '40%'][i] }} /><u style={{ width: '34%' }} /></div></div>)}
      </div>
      <TabBar role="player" on="Actions" />
    </PhoneApp>
  );
}

export function StatesSheet({ theme }: { theme: Theme }) {
  return (
    <div className="st-sheet">
      <section className="st-sec">
        <header className="st-h"><h1>A short drop</h1><p>Four seconds without the server. The table stays in full view; only “Take my turn” waits for it.</p></header>
        <ShortDrop theme={theme} />
      </section>
      <section className="st-sec">
        <header className="st-h"><h1>Loading is not empty</h1><p>Loading is hatched in the shape of what is coming and says what it is fetching. Empty is an open strip with one thing to do.</p></header>
        <div className="st-grid">
          <Panel title="Loading a session" note="Drawn as the table it will be"><LoadingSession /></Panel>
          <Panel title="Loading campaigns" note="Slow, not missing"><LoadingList /></Panel>
          <Panel title="No campaigns" note="Truly empty"><EmptyList /></Panel>
        </div>
      </section>
      <section className="st-sec">
        <header className="st-h"><h1>When something fails</h1><p>Each one says what happened and gives a way on. None of them strands you on a blank page.</p></header>
        <div className="st-grid">
          <Panel title="Connection lost" note="After 30 seconds of trying"><Problem icon={<WifiOff size={30} strokeWidth={2.4} />} title="Can’t reach the table" body="Anvil tried for 30 seconds. Everything up to the drop is saved." go={<><RefreshCw size={16} strokeWidth={3} />Try again</>} alt="Back to campaign" /></Panel>
          <Panel title="Bad session link" note="Was “Not found” and Refresh"><Problem icon={<Unplug size={30} strokeWidth={2.4} />} title="No live session at this link" body="It may have ended. Its campaign keeps everything that happened." go="Your campaigns" alt="Use a room code" /></Panel>
          <Panel title="Bad campaign link" note="Was “Loading…” for ever"><Problem icon={<BookOpen size={30} strokeWidth={2.4} />} title="No campaign at this link" body="It may have been deleted, or it belongs to another account." go="Your campaigns" /></Panel>
          <Panel title="Bad address, signed in" note="Was the marketing page"><Problem icon={<Home size={30} strokeWidth={2.4} />} title="No page at /app/campains" body="Check the spelling, or go back to your home page." go="Go to your home" alt={<><ArrowLeft size={16} strokeWidth={3} />Back</>} /></Panel>
          <Panel title="Bad invite" note="Was bare red text"><Problem icon={<Unplug size={30} strokeWidth={2.4} />} title="This invite link no longer works" body="Ask your Director for a new link, or use the room code they gave you." go="Join with a room code" /></Panel>
          <Panel title="Anvil updated" note="Was “Update needed”"><Problem icon={<RefreshCw size={30} strokeWidth={2.4} />} title="A new version of Anvil is ready" body="Reload to load it. Your session is saved on the server." go={<><RefreshCw size={16} strokeWidth={3} />Reload</>} /></Panel>
        </div>
      </section>
      <section className="st-sec">
        <header className="st-h"><h1>On the phone</h1><p>The lock screen keeps its clear instructions. A drop keeps the sheet readable. Loading is hatched here too.</p></header>
        <div className="st-phones">
          <Tile title="Phone locked" note="Unlocks by itself"><PhoneLocked /></Tile>
          <Tile title="Phone, short drop" note="Reading still works">
            <PlayerBattle drop={<div className="st-drop st-drop--phone" role="status"><i><WifiOff size={16} strokeWidth={2.6} /></i><span><b>Reconnecting…</b> You can keep reading.</span></div>} />
          </Tile>
          <Tile title="Phone loading" note="Not an empty sheet"><PhoneLoading /></Tile>
        </div>
      </section>
    </div>
  );
}

export function StatesStill() {
  const theme = themeFor('light');
  return <Stage width={SHEET.w} height={SHEET.h} theme={theme} unframed className="look-anvil">{() => <StatesSheet theme={theme} />}</Stage>;
}
