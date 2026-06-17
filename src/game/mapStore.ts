/**
 * 編集可能なマップの状態ストア。
 *
 * ゲームが参照する「現在のマップ（タイル）」「置かれた画像プロップ」「画像アセット一覧」を
 * 保持し、編集モードから書き換えられる。変更は localStorage に永続化し、
 * useSyncExternalStore でコンポーネントへ反映する。
 *
 * 公開時はエディタUIを外すだけでよい（このストア自体は保存済みマップの読込にも使う）。
 */

import { useSyncExternalStore } from "react";
import { DEFAULT_MAP, isBlocking, MAP_H, MAP_W, type TileChar } from "./map";

export interface MapProp {
  id: string;
  /** 画像パス（public/illust/ 配下など） */
  src: string;
  /** 左上タイル座標 */
  x: number;
  y: number;
  /** 横幅（タイル数）。高さは画像のアスペクト比で自動 */
  w: number;
}

const KEYS = {
  map: "earnflow.map",
  props: "earnflow.props",
  assets: "earnflow.assets",
} as const;

const DEFAULT_ASSETS = ["/illust/castle.jpeg", "/illust/cave.png"];

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

let mapRows: string[] = sanitizeMap(load<string[]>(KEYS.map, DEFAULT_MAP));
let props: MapProp[] = load<MapProp[]>(KEYS.props, []);
let assets: string[] = dedupe([...DEFAULT_ASSETS, ...load<string[]>(KEYS.assets, [])]);

/** 行数・桁数が現在のマップサイズと一致しなければ既定に戻す（サイズ変更時の保険） */
function sanitizeMap(rows: string[]): string[] {
  if (
    Array.isArray(rows) &&
    rows.length === MAP_H &&
    rows.every((r) => typeof r === "string" && r.length === MAP_W)
  ) {
    return rows;
  }
  return DEFAULT_MAP.slice();
}

function dedupe(list: string[]): string[] {
  return Array.from(new Set(list));
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ---------------- 読み取り（ゲームロジック用・非リアクティブ） ---------------- */

export function tileAt(x: number, y: number): TileChar | null {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return null;
  return mapRows[y][x] as TileChar;
}
export function isWalkable(x: number, y: number): boolean {
  return !isBlocking(tileAt(x, y));
}

/* ---------------- React 用フック（リアクティブ） ---------------- */

export function useMapRows(): string[] {
  return useSyncExternalStore(subscribe, () => mapRows, () => mapRows);
}
export function useProps(): MapProp[] {
  return useSyncExternalStore(subscribe, () => props, () => props);
}
export function useAssets(): string[] {
  return useSyncExternalStore(subscribe, () => assets, () => assets);
}

/* ---------------- 編集（ミューテーション） ---------------- */

export function paintTile(x: number, y: number, ch: TileChar): void {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return;
  if (mapRows[y][x] === ch) return;
  const next = mapRows.slice();
  const row = next[y];
  next[y] = row.slice(0, x) + ch + row.slice(x + 1);
  mapRows = next;
  save(KEYS.map, mapRows);
  emit();
}

export function addProp(p: MapProp): void {
  props = [...props, p];
  save(KEYS.props, props);
  emit();
}
export function removeProp(id: string): void {
  props = props.filter((p) => p.id !== id);
  save(KEYS.props, props);
  emit();
}
export function setPropWidth(id: string, w: number): void {
  props = props.map((p) => (p.id === id ? { ...p, w: Math.max(1, Math.min(16, w)) } : p));
  save(KEYS.props, props);
  emit();
}

export function addAsset(src: string): void {
  const clean = src.trim();
  if (!clean) return;
  assets = dedupe([...assets, clean]);
  save(KEYS.assets, assets);
  emit();
}

export function resetMap(): void {
  mapRows = DEFAULT_MAP.slice();
  props = [];
  save(KEYS.map, mapRows);
  save(KEYS.props, props);
  emit();
}
