import { useId } from 'react';
import { resolveApiBackedMediaUrl } from '../../../lib/api-url.js';
import { OCTAGON_POINTS, entityPortrait, faceKeyFor, faceUrl, isRoundToken } from '../../../lib/faces.js';

interface FaceEntity extends Record<string, unknown> {
  name: string;
  type: string;
}

const OCT = OCTAGON_POINTS.map(([x, y]) => `${x},${y}`).join(' ');

/**
 * One face per entity (DESIGN.md "Token face"). A drawn head, or an uploaded portrait as a sticker:
 * clipped to the side's shape, a white keyline, the ink outline and an offset shadow. Decorative:
 * the row beside it carries the name.
 */
export function TokenFace({ entity, size, out = false }: { entity: FaceEntity; size: number; out?: boolean }) {
  const portrait = entityPortrait(entity);
  if (portrait) return <Sticker url={portrait} round={isRoundToken(entity)} size={size} out={out} />;
  return <img src={faceUrl(faceKeyFor(entity), out)} width={size} height={size} alt="" aria-hidden="true" draggable={false} />;
}

function Sticker({ url, round, size, out }: { url: string; round: boolean; size: number; out: boolean }) {
  const id = useId().replace(/:/g, '');
  const shape = (props: Record<string, unknown>) =>
    round ? <circle cx="32" cy="32" r="30" {...props} /> : <polygon points={OCT} {...props} />;
  const ink = { fill: 'var(--art-ink)', stroke: 'var(--art-ink)', strokeWidth: 4, strokeLinejoin: 'round' as const };
  const inner = 'translate(32 32) scale(.88) translate(-32 -32)';
  return (
    <svg width={size} height={size} viewBox="-5 -5 76 76" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>{shape({})}</clipPath>
      </defs>
      <g transform="translate(2.2 2.6)">{shape(ink)}</g>
      {shape(ink)}
      <g transform="translate(32 32) scale(.97) translate(-32 -32)">{shape({ fill: 'var(--art-plate)' })}</g>
      <g transform={inner}>
        <g clipPath={`url(#${id}-clip)`}>
          <image
            href={resolveApiBackedMediaUrl(url)}
            x="2"
            y="2"
            width="60"
            height="60"
            preserveAspectRatio="xMidYMid slice"
            style={out ? { filter: 'grayscale(1)' } : undefined}
          />
        </g>
      </g>
      {out && (
        <g strokeLinecap="round" fill="none">
          <path d="M18 18l28 28M46 18l-28 28" stroke="var(--art-plate)" strokeWidth="7" />
          <path d="M18 18l28 28M46 18l-28 28" stroke="var(--art-ink)" strokeWidth="4" />
        </g>
      )}
    </svg>
  );
}
