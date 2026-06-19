/**
 * 町（ステージ）の滞在状態と「町おこし」の状態。
 *
 * - 12の町（themes.ts のテーマ）を行き来できる。currentTown を切り替えると表示が変わる。
 * - ガチャで当てたキャラを各町に「派遣」して住民にすると、にぎわい度が上がり収入が増える。
 *   1キャラは同時に1つの町にだけ滞在できる。
 */

import { useSyncExternalStore } from "react";
import { THEMES } from "./themes";
import { getBuiltinCharacter, type Rarity } from "@/components/pixel/sprites";

const KEYS = {
  town: "earnflow.currentTown",
  residents: "earnflow.townResidents",
} as const;

/** レア度ごとの収入アップ寄与（住民1人あたり） */
const RARITY_BOOST: Record<Rarity, number> = { N: 0.01, R: 0.02, SR: 0.04, SSR: 0.07, UR: 0.12 };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const clampTown = (i: number) => Math.max(0, Math.min(THEMES.length - 1, i));

let currentTown = clampTown(load<number>(KEYS.town, 0));
/** townIndex -> 住民キャラID配列 */
let residents: Record<number, string[]> = load<Record<number, string[]>>(KEYS.residents, {});

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ---------------- 滞在中の町 ---------------- */

export function useCurrentTown(): number {
  return useSyncExternalStore(subscribe, () => currentTown, () => currentTown);
}
export function getCurrentTown(): number {
  return currentTown;
}
export function setCurrentTown(i: number): void {
  const next = clampTown(i);
  if (next === currentTown) return;
  currentTown = next;
  save(KEYS.town, currentTown);
  emit();
}

/* ---------------- 住民（町おこし） ---------------- */

export function useResidents(): Record<number, string[]> {
  return useSyncExternalStore(subscribe, () => residents, () => residents);
}
export function residentsOf(i: number): string[] {
  return residents[i] ?? [];
}

/** キャラを指定の町へ派遣（他の町からは外す＝1キャラ1町） */
export function assignResident(townIndex: number, id: string): void {
  if (!id) return;
  const next: Record<number, string[]> = {};
  for (const k of Object.keys(residents)) {
    const idx = Number(k);
    next[idx] = residents[idx].filter((r) => r !== id);
  }
  const t = clampTown(townIndex);
  next[t] = [...(next[t] ?? []), id];
  residents = next;
  save(KEYS.residents, residents);
  emit();
}

/** 住民を外す */
export function removeResident(townIndex: number, id: string): void {
  const t = clampTown(townIndex);
  if (!residents[t]) return;
  residents = { ...residents, [t]: residents[t].filter((r) => r !== id) };
  save(KEYS.residents, residents);
  emit();
}

/** その町にいる住民が今いる町（idで検索）。未派遣は -1 */
export function townOfResident(id: string): number {
  for (const k of Object.keys(residents)) {
    if (residents[Number(k)].includes(id)) return Number(k);
  }
  return -1;
}

const boostOf = (id: string) => RARITY_BOOST[getBuiltinCharacter(id)?.rarity ?? "N"];

/** その町のにぎわいによる収入アップ率（0.0〜） */
export function townBoost(i: number): number {
  return residentsOf(i).reduce((s, id) => s + boostOf(id), 0);
}

/** 全町合計の収入アップ率（収入計算に反映） */
export function getTownBoost(): number {
  let total = 0;
  for (const k of Object.keys(residents)) {
    total += residents[Number(k)].reduce((s, id) => s + boostOf(id), 0);
  }
  return total;
}

export function useTownBoost(): number {
  return useSyncExternalStore(subscribe, getTownBoost, getTownBoost);
}
