// Placeholder scene art for the four non-Battle modes, drawn here in the Storyboard ink
// style: flat fills, one ink outline weight, no gradients. It stands in for the art a
// Director uploads. Nothing here is from a published adventure. Each drawing fills its
// box (slice), and the art dims in dark theme through the same .sb-art filter as the map.
import type { ReactNode } from 'react';

const INK = '#15171c';
const ink = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Art({ w, h, children, align = 'xMidYMin', box = '0 0 800 720' }: { w: number; h: number; children: ReactNode; align?: string; box?: string }) {
  return (
    <svg className="sb-art" width={w} height={h} viewBox={box} preserveAspectRatio={`${align} slice`} aria-hidden>
      {children}
    </svg>
  );
}

// A drowned chapel at night: the moon, a leaning bell tower with a lit lantern, a rope.
export function StoryArt({ w, h }: { w: number; h: number }) {
  return (
    <Art w={w} h={h}>
      <rect width="800" height="720" fill="#2b3566" />
      <rect y="170" width="800" height="550" fill="#34407a" />
      {[[80, 60], [190, 120], [300, 40], [470, 90], [720, 200], [760, 60], [540, 30], [40, 180]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#e9e3c4" />)}
      <circle {...ink} cx="640" cy="110" r="52" fill="#f3e7b0" />
      <circle cx="622" cy="96" r="10" fill="#e3d48f" /><circle cx="656" cy="128" r="7" fill="#e3d48f" />
      <path {...ink} fill="#232c55" d="M-10 300Q120 230 250 270T520 250T810 280V400H-10Z" />
      <rect y="330" width="800" height="390" fill="#1f4b62" />
      <g transform="rotate(7 330 330)">
        <path {...ink} fill="#8b8576" d="M300 330V110L330 70l30 40v220Z" />
        <path {...ink} fill="#5e594f" d="M292 112l38-58 38 58Z" />
        <rect {...ink} x="315" y="130" width="30" height="40" fill="#ffd21f" />
        <circle cx="330" cy="152" r="7" fill="#fff6c9" />
        <path stroke="#e9e3c4" strokeWidth="3" d="M332 172V330" />
      </g>
      <path {...ink} fill="#77715f" d="M380 330V250l70-46 70 46v80Z" />
      <path {...ink} fill="#4a4a54" d="M370 252l80-60 80 60Z" />
      {[400, 440, 480].map((x) => <path key={x} {...ink} strokeWidth={3} fill="#15171c" d={`M${x} 330v-34q10-14 20 0v34`} />)}
      <g stroke="#7fb6c9" strokeWidth="4" strokeLinecap="round" opacity=".7">
        <path d="M60 380h80M210 410h60M520 372h110M640 420h90M120 470h120M420 450h70" />
      </g>
      <g {...ink} strokeWidth={3} fill="#2f5a3a">
        <path d="M20 720V520q8-30 16 0v200ZM48 720V470q8-30 16 0v250ZM78 720V540q8-30 16 0v180ZM760 720V500q8-30 16 0v220Z" />
      </g>
    </Art>
  );
}

// A swamp at dusk: a low sun, dead trees, a broken boardwalk, the ferry post and its rope.
export function MontageArt({ w, h }: { w: number; h: number }) {
  return (
    <Art w={w} h={h}>
      <rect width="800" height="720" fill="#f0b15a" />
      <rect y="120" width="800" height="600" fill="#e98f4c" />
      <path {...ink} fill="#ffd77a" d="M300 260a110 110 0 0 1 220 0Z" />
      <path {...ink} fill="#6b4a3a" d="M-10 262Q100 220 190 250t230-6 210 14 180-10V320H-10Z" />
      <rect y="300" width="800" height="420" fill="#6f8f6a" />
      <g stroke="#9dbb8f" strokeWidth="4" strokeLinecap="round"><path d="M40 360h100M240 400h70M470 352h120M610 430h120M90 520h140M380 560h90M560 620h150" /></g>
      <g {...ink} fill="#5a3f30">
        <path d="M80 300V150l-30-40M80 190l40-36M80 230l-36-22" fill="none" strokeWidth="9" />
        <path d="M690 300V130l30-44M690 180l-40-30M690 220l34-20" fill="none" strokeWidth="9" />
      </g>
      <g {...ink} strokeWidth={3} fill="#c58b55">
        <path d="M120 470l70-20 10 18-70 20ZM210 444l70-18 8 18-70 18ZM330 414l60-14 6 16-60 14Z" />
      </g>
      <path {...ink} fill="#7a5a44" d="M720 520V300h22v220Z" />
      <path stroke={INK} strokeWidth="5" fill="none" d="M742 320Q780 360 810 350" />
      <path stroke="#f3e2b8" strokeWidth="2.5" fill="none" d="M742 320Q780 360 810 350" />
    </Art>
  );
}

// A lantern market at night: striped awnings, a string of lanterns, crates.
export function NegotiationArt({ w, h }: { w: number; h: number }) {
  return (
    <Art w={w} h={h}>
      <rect width="800" height="720" fill="#2a2846" />
      <rect y="560" width="800" height="160" fill="#3b3550" />
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} {...ink} strokeWidth={3} fill={i % 2 ? '#f1e6cf' : '#c8463b'} d={`M${i * 82 - 10} 0h82v120q-41 26-82 0Z`} />
      ))}
      <path stroke={INK} strokeWidth="3" fill="none" d="M-10 440Q200 500 400 450T810 460" />
      {[[60, 456], [170, 482], [280, 474], [400, 450], [520, 456], [640, 464], [750, 460]].map(([x, y]) => (
        <g key={x}><path stroke={INK} strokeWidth="3" d={`M${x} ${y}v10`} /><rect {...ink} strokeWidth={3} x={x - 12} y={y + 10} width="24" height="30" rx="6" fill="#ffcc4d" /></g>
      ))}
      <g {...ink} strokeWidth={3} fill="#8a6142">
        <rect x="560" y="600" width="120" height="90" /><rect x="610" y="530" width="90" height="70" /><rect x="40" y="620" width="110" height="80" />
      </g>
      <path stroke={INK} strokeWidth="3" d="M560 645h120M40 660h110" />
    </Art>
  );
}

// A camp at night: pines, a tent, a fire with sparks.
export function RespiteArt({ w, h }: { w: number; h: number }) {
  return (
    <Art w={w} h={h} align="xMidYMax" box="0 330 800 300">
      <rect width="800" height="720" fill="#1f2c3d" />
      {[[90, 80], [230, 50], [380, 110], [610, 60], [720, 130], [520, 150]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#e9e3c4" />)}
      <rect y="470" width="800" height="250" fill="#2c3b2a" />
      {[[40, 470, 90], [140, 470, 70], [660, 470, 80], [750, 470, 100], [560, 470, 60]].map(([x, y, s]) => (
        <path key={x} {...ink} strokeWidth={3} fill="#1d3b2c" d={`M${x} ${y - s * 3}l${s} ${s * 3}H${x - s}Z`} />
      ))}
      <path {...ink} fill="#c99a5b" d="M150 560l110-170 110 170Z" />
      <path {...ink} fill="#3a2a1e" d="M240 560l20-60 20 60Z" />
      <circle cx="430" cy="560" r="120" fill="#ff9a3c" opacity=".18" />
      <g {...ink} strokeWidth={3}>
        <path fill="#7a4e2e" d="M370 600l120-30 8 18-120 30ZM380 570l120 30-6 18-120-30Z" />
        <path fill="#ff7a1a" d="M430 590q-50-30-10-90 0 30 20 34 2-30 24-50 10 50 6 70 14-10 14-30 30 50-24 66Z" />
        <path fill="#ffd21f" d="M436 588q-20-20 0-50 6 20 18 22 10 18-18 28Z" strokeWidth={2.5} />
      </g>
      {[[400, 470], [460, 450], [480, 490], [420, 430]].map(([x, y]) => <rect key={x} x={x} y={y} width="6" height="6" fill="#ffd21f" transform={`rotate(45 ${x} ${y})`} />)}
    </Art>
  );
}

// The fence across the table: hood, spectacles, a bun, a wary mouth. Placeholder.
export function MaudreyFace({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="-6 -6 112 112" aria-hidden>
      <path {...ink} fill="#3f6b4f" d="M8 100Q4 30 50 8t42 92Z" />
      <ellipse {...ink} cx="50" cy="56" rx="26" ry="31" fill="#e6b58f" />
      <path {...ink} fill="#c9ccd1" d="M25 46q2-22 25-22t25 22q-10-10-25-10T25 46Z" />
      <circle {...ink} cx="50" cy="20" r="9" fill="#c9ccd1" />
      <circle {...ink} strokeWidth={3} cx="40" cy="54" r="8" fill="#fff" /><circle {...ink} strokeWidth={3} cx="61" cy="54" r="8" fill="#fff" />
      <path stroke={INK} strokeWidth="3" d="M48 54h5" />
      <circle cx="41" cy="55" r="2.6" fill={INK} /><circle cx="60" cy="55" r="2.6" fill={INK} />
      <path {...ink} strokeWidth={3} fill="none" d="M50 60l-3 10h6" />
      <path {...ink} strokeWidth={3} fill="none" d="M41 76q9-4 18 0" />
      <circle cx="66" cy="68" r="2" fill={INK} />
    </svg>
  );
}

// Three small vignettes for the montage challenges.
export function ChallengeArt({ i }: { i: number }) {
  const scenes = [
    <><rect width="200" height="60" fill="#6f8f6a" /><g {...ink} strokeWidth={3} fill="#c58b55"><path d="M20 40l40-10 6 12-40 10ZM80 26l40-8 4 12-40 8ZM146 16l34-6 3 12-34 6Z" /></g></>,
    <><rect width="200" height="60" fill="#8fa07a" /><path {...ink} strokeWidth={3} fill="#d9d4c4" d="M30 44q-10-24 20-26 10-16 34-8 24-12 40 6 30 0 26 28Z" />{[[70, 30], [100, 24], [120, 38], [90, 42]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill={INK} />)}</>,
    <><rect width="200" height="60" fill="#5f7f8f" /><path {...ink} fill="#7a5a44" d="M150 60V8h14v52Z" /><path stroke={INK} strokeWidth="5" fill="none" d="M164 14Q120 50 0 36" /><path stroke="#f3e2b8" strokeWidth="2.5" fill="none" d="M164 14Q120 50 0 36" /></>,
  ];
  return <svg className="md-ch__art" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid slice" aria-hidden>{scenes[i]}</svg>;
}

// Small heads for the people in a scene, in the same ink as the heroes' faces.
export function NpcHead({ kind, size }: { kind: 'nun' | 'ferryman' | 'ringer' | 'guard'; size: number }) {
  const hat = {
    nun: <path {...ink} fill="#e9e6dc" d="M10 40Q8 8 32 6t22 34v20H10Z" />,
    ferryman: <path {...ink} fill="#6b4f36" d="M4 26h56l-8-6q-4-14-20-14T12 20Z" />,
    ringer: <path {...ink} fill="#4b4f5c" d="M8 58Q4 10 32 4t24 54Z" />,
    guard: <path {...ink} fill="#8b8f98" d="M12 30q0-22 20-22t20 22Z" />,
  }[kind];
  const skin = { nun: '#f0c9a4', ferryman: '#c98a5e', ringer: '#d9b08c', guard: '#a8704a' }[kind];
  return (
    <svg width={size} height={size} viewBox="-6 -6 76 76" aria-hidden>
      {kind === 'ringer' || kind === 'nun' ? hat : null}
      <circle {...ink} cx="32" cy="36" r="17" fill={skin} />
      {kind === 'ferryman' || kind === 'guard' ? hat : null}
      <g fill={INK}><circle cx="26" cy="37" r="2.8" /><circle cx="38" cy="37" r="2.8" /></g>
      <path {...ink} strokeWidth={3} fill="none" d={kind === 'guard' ? 'M26 46h12' : 'M27 45q5 3 10 0'} />
    </svg>
  );
}
