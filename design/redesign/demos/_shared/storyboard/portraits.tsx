// Uploaded token art. Real tables upload portraits, and the drawn heads will not cover
// everything, so an upload becomes a sticker: the art is clipped to a shape, gets a white
// keyline, the same ink outline as a drawn head and the same small offset shadow.
// Heroes are round, monsters are eight-sided, so side still reads by shape.
// The two portraits here are placeholders painted in code, to stand in for an upload.
import { useId } from 'react';

const OCT = '20,2 44,2 62,20 62,44 44,62 20,62 2,44 2,20';

function HeroPaint({ id }: { id: string }) {
  return (
    <g filter={`url(#${id}-soft)`}>
      <rect x="-4" y="-4" width="72" height="72" fill={`url(#${id}-sky)`} />
      <path d="M2 70q4-22 30-22t30 22Z" fill="#5a4a3a" />
      <path d="M6 70q5-16 14-19l12 6 12-6q9 3 14 19Z" fill="#8c7a5e" />
      <ellipse cx="32" cy="29" rx="15" ry="18" fill={`url(#${id}-skin)`} />
      <path d="M15 25q0-19 17-19t17 19q-4-9-17-9t-17 9Z" fill="#3b2a20" />
      <path d="M17 34q2 21 15 21t15-21q-4 7-15 7t-15-7Z" fill="#a4471f" />
      <path d="M25 40q7 3 14 0-2 5-7 5t-7-5Z" fill="#7c3216" />
      <ellipse cx="25.5" cy="29" rx="2" ry="1.4" fill="#22303a" /><ellipse cx="38.5" cy="29" rx="2" ry="1.4" fill="#22303a" />
      <path d="M21 25q5-3 9 0M34 25q5-3 9 0" stroke="#3b2a20" strokeWidth="1.6" fill="none" />
      <ellipse cx="38" cy="22" rx="6" ry="4" fill="#fff" opacity=".18" />
    </g>
  );
}

function FoePaint({ id }: { id: string }) {
  return (
    <g filter={`url(#${id}-soft)`}>
      <rect x="-4" y="-4" width="72" height="72" fill={`url(#${id}-dusk)`} />
      <ellipse cx="17" cy="18" rx="10" ry="11" fill="#6f5a48" /><ellipse cx="47" cy="18" rx="10" ry="11" fill="#6f5a48" />
      <ellipse cx="17" cy="19" rx="5.5" ry="6.5" fill="#c58f7e" /><ellipse cx="47" cy="19" rx="5.5" ry="6.5" fill="#c58f7e" />
      <path d="M12 32q0-14 20-14t20 14q-3 16-20 27-17-11-20-27Z" fill={`url(#${id}-fur)`} />
      <path d="M20 12l3 8 9-5 9 5 3-8 2 12H18Z" fill="#d8a93a" />
      <ellipse cx="24" cy="33" rx="3" ry="2.6" fill="#e9b949" /><ellipse cx="40" cy="33" rx="3" ry="2.6" fill="#e9b949" />
      <circle cx="24" cy="33" r="1.3" fill="#1c1410" /><circle cx="40" cy="33" r="1.3" fill="#1c1410" />
      <ellipse cx="32" cy="49" rx="4" ry="3" fill="#2a1d18" />
      <ellipse cx="38" cy="26" rx="8" ry="5" fill="#fff" opacity=".14" />
    </g>
  );
}

export function Portrait({ who, size, side }: { who: 'hero' | 'foe'; size: number; side?: 'hero' | 'foe' }) {
  const id = useId().replace(/:/g, '');
  const shape = (side ?? who) === 'hero' ? 'circle' : 'oct';
  const outline = (p: Record<string, unknown>) => (shape === 'circle' ? <circle cx="32" cy="32" r="30" {...p} /> : <polygon points={OCT} {...p} />);
  return (
    <svg width={size} height={size} viewBox="-5 -5 76 76" aria-hidden>
      <defs>
        <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".45" /></filter>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fa3a6" /><stop offset="1" stopColor="#2f4a55" /></linearGradient>
        <radialGradient id={`${id}-skin`} cx=".62" cy=".32" r=".8"><stop offset="0" stopColor="#f0c7a0" /><stop offset="1" stopColor="#a86f4c" /></radialGradient>
        <linearGradient id={`${id}-dusk`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d5a4a" /><stop offset="1" stopColor="#23302c" /></linearGradient>
        <radialGradient id={`${id}-fur`} cx=".6" cy=".3" r=".85"><stop offset="0" stopColor="#b59a7d" /><stop offset="1" stopColor="#57443a" /></radialGradient>
        <clipPath id={`${id}-clip`}>{outline({})}</clipPath>
      </defs>
      <g transform="translate(2.2 2.6)">{outline({ fill: '#15171c', stroke: '#15171c', strokeWidth: 4, strokeLinejoin: 'round' })}</g>
      {outline({ fill: '#15171c', stroke: '#15171c', strokeWidth: 4, strokeLinejoin: 'round' })}
      <g transform="translate(32 32) scale(.97) translate(-32 -32)">{outline({ fill: '#fff' })}</g>
      <g transform="translate(32 32) scale(.88) translate(-32 -32)"><g clipPath={`url(#${id}-clip)`}>{who === 'hero' ? <HeroPaint id={id} /> : <FoePaint id={id} />}</g></g>
    </svg>
  );
}
