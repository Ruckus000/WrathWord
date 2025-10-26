// src/logic/selectDaily.ts
import {mulberry32} from './rng';

export function seededIndex(seedStr: string, max: number) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = mulberry32(h >>> 0)();
  return Math.floor(rnd * max);
}

export function selectDaily(len: number, maxRows: number, dateISO: string, answers: string[]) {
  const idx = seededIndex(`${dateISO}:${len}:${maxRows}`, answers.length);
  return answers[idx];
}
