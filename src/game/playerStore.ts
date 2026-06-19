/**
 * プレイヤーの所持ゴールド（コスチューム購入用の通貨）と所持コスチュームの状態。
 *
 * レベルアップで「ゴールド」を獲得し、コスチューム（キャラ見た目）の購入に使う。
 * ※ レベル/経験値の元になる累計収入(totalGold)とは別の「使えるゴールド」。
 */

import { useSyncExternalStore } from "react";
import { SHOP_ITEMS } from "./items";

const KEYS = {
  wallet: "earnflow.wallet",
  owned: "earnflow.owned",
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

let wallet: number = load<number>(KEYS.wallet, 0);
let owned: string[] = load<string[]>(KEYS.owned, []);

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useWallet(): number {
  return useSyncExternalStore(subscribe, () => wallet, () => wallet);
}
export function useOwned(): string[] {
  return useSyncExternalStore(subscribe, () => owned, () => owned);
}

/** レベルアップ等でゴールドを獲得 */
export function addGold(n: number): void {
  if (n <= 0) return;
  wallet += n;
  save(KEYS.wallet, wallet);
  emit();
}

/** 既定キャラ（src="")は常に所持扱い */
export function isOwned(src: string): boolean {
  return src === "" || owned.includes(src);
}

/** 所持リスト（非リアクティブ読み取り） */
export function getOwned(): string[] {
  return owned;
}

/** 無償で所持に追加（家の報酬など）。追加できたら true */
export function grantOwned(id: string): boolean {
  if (!id || isOwned(id)) return false;
  owned = [...owned, id];
  save(KEYS.owned, owned);
  emit();
  return true;
}

/** コスチューム/アイテムを購入（所持金が足りれば true）。id/src を所持リストに追加 */
export function buy(idOrSrc: string, price: number): boolean {
  if (isOwned(idOrSrc)) return true;
  if (wallet < price) return false;
  wallet -= price;
  owned = [...owned, idOrSrc];
  save(KEYS.wallet, wallet);
  save(KEYS.owned, owned);
  emit();
  return true;
}

export interface GachaGroup {
  /** レア度ラベル（"N"〜"UR"） */
  rarity: string;
  /** 排出ウェイト（合計に対する相対値） */
  weight: number;
  /** このレア度のコスチュームID群 */
  ids: string[];
}

export interface GachaResult {
  /** 出たコスチュームのID/画像src */
  id: string;
  /** 新規獲得なら true、ダブり（同じキャラ）なら false */
  isNew: boolean;
  /** 出たレア度 */
  rarity: string;
}

/**
 * ガチャを1回引く（レア度の重み付き抽選）。所持金が足りなければ null。
 * まずレア度をウェイトで抽選 → その中から等確率で1体。
 * 新規なら所持に追加、ダブり（同じキャラ）なら dupRefund を返金する。
 */
export function gachaPull(price: number, groups: GachaGroup[], dupRefund: number): GachaResult | null {
  if (wallet < price) return null;
  const avail = groups.filter((g) => g.ids.length > 0 && g.weight > 0);
  if (avail.length === 0) return null;
  wallet -= price;

  const totalW = avail.reduce((s, g) => s + g.weight, 0);
  let r = Math.random() * totalW;
  let chosen = avail[avail.length - 1];
  for (const g of avail) {
    if (r < g.weight) {
      chosen = g;
      break;
    }
    r -= g.weight;
  }
  const id = chosen.ids[Math.floor(Math.random() * chosen.ids.length)];
  const isNew = !owned.includes(id);
  if (isNew) {
    owned = [...owned, id];
    save(KEYS.owned, owned);
  } else {
    wallet += dupRefund;
  }
  save(KEYS.wallet, wallet);
  emit();
  return { id, isNew, rarity: chosen.rarity };
}

/** 所持アイテムによる収入倍率（1.0 = 等倍）。非リアクティブ読み取り（エンジン用） */
export function getEarningBoost(): number {
  let boost = 1;
  for (const item of SHOP_ITEMS) {
    if (owned.includes(item.id)) boost += item.boost;
  }
  return boost;
}
/** リアクティブ版（表示用） */
export function useEarningBoost(): number {
  return useSyncExternalStore(subscribe, getEarningBoost, getEarningBoost);
}
