/**
 * 町（ステージ）の滞在状態と「町おこし」の状態。
 *
 * - 12の町（themes.ts のテーマ）を行き来できる。currentTown を切り替えると表示が変わる。
 * - ガチャで当てたキャラを各町に「派遣」して住民にすると、にぎわい度が上がり収入が増える。
 *   1キャラは同時に1つの町にだけ滞在できる。
 */

import { useSyncExternalStore } from "react";
import { THEMES } from "./themes";
import { CHARACTERS, getBuiltinCharacter, type Rarity } from "@/components/pixel/sprites";
import { addGold, getOwned, grantOwned } from "./playerStore";
import { toDateKey } from "@/lib/utils";

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

/* ---------------- 街からの仕送り（idle収入）は廃止 ----------------
 * 派遣した住民からゴールドを得る仕組みは削除しました。
 * 町は「発展（見た目の成長）・図鑑・衣装プレゼント」のために使います。 */

/* ---------------- 町ごとの目標 ---------------- */

/** 目標：住民をこの人数そろえる */
export const TOWN_GOAL_RESIDENTS = 5;
/** 達成報酬は廃止（ゴールドは出さない。達成は称号としてのみ残す） */
export function townGoalReward(): number {
  return 0;
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
  return townGoalReward();
}

/* ---------------- 住民の家への訪問（1日1回・報酬） ---------------- */

/** レア度ごとの訪問ゴールド報酬（家に入ると1日1回もらえる） */
const VISIT_GOLD: Record<Rarity, number> = { N: 50, R: 120, SR: 300, SSR: 700, UR: 1500 };
/** レア度ごとの衣装プレゼント確率 */
const COSTUME_CHANCE: Record<Rarity, number> = { N: 0.1, R: 0.2, SR: 0.4, SSR: 0.7, UR: 1 };

const VISIT_KEY = "earnflow.houseVisits";
let lastVisited: Record<string, string> = load<Record<string, string>>(VISIT_KEY, {});
const todayKey = () => toDateKey(new Date());

/** 今日その住民の家を訪問できるか（1日1回） */
export function canVisitResident(id: string): boolean {
  return lastVisited[id] !== todayKey();
}
export function useVisitVersion(): number {
  // 訪問状態の変化で再描画させるためのダミー購読（emit時に更新）
  return useSyncExternalStore(subscribe, () => Object.keys(lastVisited).length, () => Object.keys(lastVisited).length);
}

export interface VisitReward {
  gold: number;
  costumeId: string | null;
  rarity: Rarity;
}

/** 住民の家を訪問して報酬を受け取る。1日1回。レアなほど報酬も豪華＆衣装が高レア。 */
export function visitResident(id: string): VisitReward | null {
  if (!canVisitResident(id)) return null;
  const rarity: Rarity = getBuiltinCharacter(id)?.rarity ?? "N";
  const gold = VISIT_GOLD[rarity];
  addGold(gold);

  let costumeId: string | null = null;
  if (Math.random() < COSTUME_CHANCE[rarity]) {
    const owned = getOwned();
    const pool = CHARACTERS.filter((c) => (c.rarity ?? "N") === rarity && !owned.includes(c.id));
    if (pool.length > 0) {
      costumeId = pool[Math.floor(Math.random() * pool.length)].id;
      grantOwned(costumeId);
    }
  }

  lastVisited = { ...lastVisited, [id]: todayKey() };
  save(VISIT_KEY, lastVisited);
  emit();
  return { gold, costumeId, rarity };
}
