#!/usr/bin/env node
/**
 * One-time optimizer for the heavy marketing/dashboard images.
 * Emits .webp siblings next to the source .png files (sources are kept —
 * they remain the <picture>/image-set fallbacks).
 *
 * Usage: node scripts/optimize-marketing-images.mjs
 */
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'apps/vtt/public');

/** @type {Array<{src: string, out: string, width?: number, quality: number}>} */
const JOBS = [
  { src: 'landing/anvil-hero.png', out: 'landing/anvil-hero.webp', quality: 78 },
  {
    src: 'landing/anvil-hero.png',
    out: 'landing/anvil-hero-1280.webp',
    width: 1280,
    quality: 76,
  },
  {
    src: 'dashboard/director-flow-background.png',
    out: 'dashboard/director-flow-background.webp',
    quality: 76,
  },
  {
    src: 'dashboard/player-flow-background.png',
    out: 'dashboard/player-flow-background.webp',
    quality: 76,
  },
];

for (const job of JOBS) {
  const srcPath = path.join(PUBLIC, job.src);
  const outPath = path.join(PUBLIC, job.out);
  if (!existsSync(srcPath)) {
    console.warn(`skip (missing source): ${job.src}`);
    continue;
  }
  let pipeline = sharp(srcPath);
  if (job.width) pipeline = pipeline.resize({ width: job.width, withoutEnlargement: true });
  await pipeline.webp({ quality: job.quality }).toFile(outPath);
  const [inStat, outStat] = await Promise.all([stat(srcPath), stat(outPath)]);
  const fmt = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
  console.log(`${job.out}: ${fmt(inStat.size)} -> ${fmt(outStat.size)}`);
}
