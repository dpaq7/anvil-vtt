// Token faces. Each head has its own outline, so a hero reads by silhouette at token
// size, before colour and before any label. All of this is placeholder art drawn here.
const INK = '#15171c';
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Eyes({ y = 36, gap = 7, out }: { y?: number; gap?: number; out?: boolean }) {
  if (out) {
    return (
      <g stroke={INK} strokeWidth="3.6" strokeLinecap="round">
        {[32 - gap, 32 + gap].map((x) => <path key={x} d={`M${x - 3.6} ${y - 3.6}l7.2 7.2M${x + 3.6} ${y - 3.6}l-7.2 7.2`} />)}
      </g>
    );
  }
  return <g fill={INK}><circle cx={32 - gap} cy={y} r="3.2" /><circle cx={32 + gap} cy={y} r="3.2" /></g>;
}

export function HeroFace({ who, out, size = 44 }: { who: string; out?: boolean; size?: number }) {
  const art: Record<string, JSX.Element> = {
    // Pelt hood with animal ears
    Smoke: <>
      <path {...line} fill="#9a6333" d="M12 32L7 4l19 11q6-2 12 0L57 4l-5 28q6 24-20 28Q6 56 12 32Z" />
      <circle {...line} cx="32" cy="37" r="14" fill="#f2c79a" />
      <Eyes y={35} gap={6} /><path {...line} strokeWidth="3" fill="none" d="M27 44q5 3 10 0" />
    </>,
    // Crested helm with a slit
    Ilsabet: <>
      <path {...line} fill="#ffcf33" d="M24 16Q26-2 50 0q-10 6-10 16Z" />
      <path {...line} fill="#3b67d9" d="M9 42Q9 14 32 12q23 2 23 30v14Q32 66 9 56Z" />
      <rect {...line} x="17" y="30" width="30" height="13" rx="4" fill="#f2c79a" />
      <Eyes y={36.5} gap={7} />
      <path {...line} strokeWidth="3" fill="none" d="M32 46v12" />
    </>,
    // Great beard, wide head
    Dovrin: <>
      <path {...line} fill="#e7b58c" d="M12 32Q12 8 32 8t20 24v8H12Z" />
      <path {...line} fill="#eef0ea" d="M5 28q3 8 11 9 8 1 16-3 8 4 16 3 8-1 11-9 4 16-3 26-7 8-14 7l-10 2-10-2q-7 1-14-7-7-10-3-26Z" />
      <Eyes y={27} gap={8} />
    </>,
    // Peaked hood, masked
    Wren: <>
      <path {...line} fill="#7d4fc9" d="M32-1l20 26q8 22-4 35H16Q4 47 12 25Z" />
      <path {...line} fill="#15171c" d="M18 36q14-16 28 0 2 14-14 18-16-4-14-18Z" />
      <g fill="#fff"><path d="M23 37l7 2-7 3ZM41 37l-7 2 7 3Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></g>
    </>,
    // Horns
    Torvald: <>
      <path {...line} fill="#f4ecd8" d="M18 26Q2 22 4 0q8 14 24 15ZM46 26q16-4 14-26-8 14-24 15Z" />
      <circle {...line} cx="32" cy="36" r="23" fill="#d6372c" />
      <path {...line} strokeWidth="3.4" fill="none" d="M18 28l9 4M46 28l-9 4M24 47h16" />
      <Eyes y={36} gap={8} />
    </>,
    // Long ears, flame hair
    Ysolde: <>
      <path {...line} fill="#f6d8bd" d="M18 34L-3 20l20 26ZM46 34l21-14-20 26Z" />
      <ellipse {...line} cx="32" cy="40" rx="17" ry="20" fill="#f6d8bd" />
      <path {...line} fill="#ff7a1a" d="M13 34q-3-18 8-17 0-13 11-18 2 10 11 11-1 7 8 8 3 8-1 16-11-11-19-7-10-4-18 7Z" />
      <Eyes y={42} gap={7} /><path {...line} strokeWidth="3" fill="none" d="M28 52h8" />
    </>,
    // Great floppy hat and feather
    Pip: <>
      <circle {...line} cx="32" cy="42" r="19" fill={out ? '#c9cbc6' : '#c98a5e'} />
      <path {...line} fill="#fff" d="M45 12Q57-4 66 3q-6 8-16 17Z" />
      <path {...line} fill="#d93f9b" d="M1 31Q32 16 63 31q-8 4-15 1Q48 6 30 6 18 8 17 32 9 35 1 31Z" />
      <Eyes y={43} gap={7} out={out} />
      {out ? <path {...line} strokeWidth="3" fill="#ff7a7a" d="M27 54q5-5 10 0-5 7-10 0Z" /> : <path {...line} strokeWidth="3" fill="none" d="M27 52q5 3 10 0" />}
    </>,
  };
  return <svg width={size} height={size} viewBox="-7 -7 78 78" aria-hidden>{art[who]}</svg>;
}

export function FoeFace({ family, rank, size = 40 }: { family: 'rat' | 'frog' | 'boss' | 'cicero'; rank?: 'ratcrobat'; size?: number }) {
  const art = {
    rat: <>
      <circle {...line} cx="15" cy="17" r="12" fill={rank ? '#f28c28' : '#a39b90'} /><circle {...line} cx="49" cy="17" r="12" fill={rank ? '#f28c28' : '#a39b90'} />
      <path {...line} fill={rank ? '#f28c28' : '#a39b90'} d="M9 34q0-20 23-20t23 20Q50 52 32 62 14 52 9 34Z" />
      <path {...line} fill={INK} d="M28 50h8l-4 5Z" /><Eyes y={34} gap={9} />
    </>,
    frog: <>
      <circle {...line} cx="17" cy="19" r="13" fill="#3fae72" /><circle {...line} cx="47" cy="19" r="13" fill="#3fae72" />
      <path {...line} fill="#3fae72" d="M3 40q0-16 29-16t29 16q0 20-29 20T3 40Z" />
      <circle cx="17" cy="19" r="4" fill={INK} /><circle cx="47" cy="19" r="4" fill={INK} />
      <path {...line} fill="none" d="M13 44q19 11 38 0" />
    </>,
    boss: <>
      <path {...line} fill="#6d4bb5" d="M32-2l8 12 14-6-2 16 13 6-11 10 8 13-15 1-5 14-10-10-10 10-5-14-15-1 8-13L-1 26l13-6-2-16 14 6Z" />
      <path {...line} strokeWidth="3" fill="none" d="M20 42q12 8 24 0" /><Eyes y={30} gap={9} />
    </>,
    cicero: <>
      <circle {...line} cx="15" cy="23" r="10" fill="#c7b199" /><circle {...line} cx="49" cy="23" r="10" fill="#c7b199" />
      <path {...line} fill="#c7b199" d="M10 38q0-18 22-18t22 18Q49 54 32 62 15 54 10 38Z" />
      <path {...line} fill="#ffcf33" d="M16 22L14 4l10 8 8-11 8 11 10-8-2 18Q32 16 16 22Z" />
      <path {...line} fill={INK} d="M28 52h8l-4 5Z" /><Eyes y={38} gap={9} />
    </>,
  };
  return <svg width={size} height={size} viewBox="-7 -7 78 78" aria-hidden>{art[family]}</svg>;
}
