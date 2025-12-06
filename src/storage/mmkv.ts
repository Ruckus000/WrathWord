// src/storage/mmkv.ts
import {createMMKV} from 'react-native-mmkv';

export const kv = createMMKV();

export type Stats = {
  played: number;
  wins: number;
  streak: number;
  maxStreak: number;
  guessDist: number[]; // length 6
};

export const getJSON = <T>(key: string, fallback: T): T => {
  const v = kv.getString(key);
  return v ? (JSON.parse(v) as T) : fallback;
};

export const setJSON = (key: string, value: unknown) =>
  kv.set(key, JSON.stringify(value));
