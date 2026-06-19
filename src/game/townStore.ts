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

/* ---------------- 発展段階（にぎわいで見た目が育つ） ---------------- */

/** 住民数に応じた町の発展レベル 0〜3（建物の数に反映） */
export function townDevLevel(i: number): number {
  const n = residentsOf(i).length;
  if (n >= 6) return 3;
  if (n >= 3) return 2;
  if (n >= 1) return 1;
  return 0;
}
export function useTownDevLevel(i: number): number {
  return useSyncExternalStore(subscribe, () => townDevLevel(i), () => townDevLevel(i));
}

/* ---------------- 住民の特殊効果：ゴールド生産（idle収入） ---------------- */

/** レア度ごとの生産量（ゴールド/時） */
const RARITY_GOLD_PER_HR: Record<Rarity, number> = { N: 2, R: 5, SR: 12, SSR: 30, UR: 80 };
const goldRateOf = (id: string) => RARITY_GOLD_PER_HR[getBuiltinCharacter(id)?.rarity ?? "N"];

/** 全住民の合計ゴールド生産（/時） */
export function goldPerHour(): number {
  let total = 0;
  for (const k of Object.keys(residents)) {
    total += residents[Number(k)].reduce((s, id) => s + goldRateOf(id), 0);
  }
  return total;
}
export function useGoldPerHour(): number {
  return useSyncExternalStore(subscribe, goldPerHour, goldPerHour);
}

const COLLECT_KEY = "earnflow.townCollect";
const MAX_IDLE_HOURS = 8; // ためられる上限
let lastCollect: number = load<number>(COLLECT_KEY, Date.now());

/**
 * 前回からの経過ぶんの「町からの仕送り」を計算して回収する（上限8時間）。
 * 返り値のゴールドは呼び出し側で wallet に加算する。
 */
export function collectIdleGold(): number {
  const now = Date.now();
  const hours = Math.min(MAX_IDLE_HOURS, Math.max(0, (now - lastCollect) / 3_600_000));
  const amount = Math.floor(goldPerHour() * hours);
  lastCollect = now;
  save(COLLECT_KEY, lastCollect);
  return amount;
}

/* ---------------- 町ごとの目標 ---------------- */

/** 目標：住民をこの人数そろえる */
export const TOWN_GOAL_RESIDENTS = 5;
/** 達成報酬（後の町ほど多い） */
export function townGoalReward(i: number): number {
  return 800 + i * 400;
}

const GOALS_KEY = "earnflow.townGoals";
let claimedGoals: Record<number, boolean> = load<Record<number, boolean>>(GOALS_KEY, {});

export function isTownGoalMet(i: number): boolean {
  return residentsOf(i).length >= TOWN_GOAL_RESIDENTS;
}
export function isTownGoalClaimed(i: number): boolean {
  return !!claimedGoals[i];
}
/** 目標達成報酬を受け取る。受け取れたらゴールド額、無理なら0 */
export function claimTownGoal(i: number): number {
  if (!isTownGoalMet(i) || claimedGoals[i]) return 0;
  claimedGoals = { ...claimedGoals, [i]: true };
  save(GOALS_KEY, claimedGoals);
  emit();
  return townGoalReward(i);
}
