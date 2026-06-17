/**
 * 編集可能な「ステージ（マップ）」の状態ストア。
 *
 * 複数ステージを保持し、各ステージはタイル(rows)と画像プロップ(props)を持つ。
 * 既定で「まち(TOWN_ID)」が存在し、真っ白なステージを追加して新しいステージを作れる。
 * 変更は localStorage に永続化し、useSyncExternalStore でコンポーネントへ反映する。
 *
 * 公開時はエディタUIを外すだけでよい。
 */

import { useSyncExternalStore } from "react";
import {
  blankRows,
  DEFAULT_MAP,
  isBlocking,
  MAP_H,
  MAP_W,
  TOWN_ID,
  type TileChar,
} from "./map";
import { getBuiltinCharacter } from "@/components/pixel/sprites";
import { uid } from "@/lib/utils";

export interface MapProp {
  id: string;
  src: string;
  x: number;
  y: number;
  /** 横幅（タイル数）。高さは画像のアスペクト比で自動 */
  w: number;
}

export interface Stage {
  id: string;
  name: string;
  rows: string[];
  props: MapProp[];
}

const KEYS = {
  stages: "earnflow.stages.v2",
  assets: "earnflow.assets.v2", // v1（ユーザー追加画像）は破棄
} as const;

// 既定の配置用画像は持たない（ユーザーがD&D等で追加する）
const DEFAULT_ASSETS: string[] = [];

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
function dedupe(list: string[]): string[] {
  return Array.from(new Set(list));
}

function townStage(): Stage {
  return { id: TOWN_ID, name: "まち", rows: DEFAULT_MAP.slice(), props: [] };
}

function validRows(rows: unknown): rows is string[] {
  return (
    Array.isArray(rows) &&
    rows.length === MAP_H &&
    rows.every((r) => typeof r === "string" && r.length === MAP_W)
  );
}

interface Persisted {
  stages: Stage[];
  activeId: string;
}

function loadStages(): Persisted {
  const p = load<Partial<Persisted>>(KEYS.stages, {});
  let stages = Array.isArray(p.stages) ? p.stages.filter((s) => validRows(s?.rows)) : [];
  if (!stages.some((s) => s.id === TOWN_ID)) stages = [townStage(), ...stages];
  const activeId = p.activeId && stages.some((s) => s.id === p.activeId) ? p.activeId : TOWN_ID;
  return { stages, activeId };
}

const persisted = loadStages();
let stages: Stage[] = persisted.stages;
let activeId: string = persisted.activeId;
let assets: string[] = dedupe([...DEFAULT_ASSETS, ...load<string[]>(KEYS.assets, [])]);
/** 操作キャラ（空文字＝既定の勇者 / "char:..."＝組み込み）。
 *  以前に画像srcを装備していた場合は、画像を一掃したので既定に戻す。 */
let character: string = load<string>("earnflow.character", "");
if (character !== "" && !getBuiltinCharacter(character)) character = "";

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function persist() {
  save(KEYS.stages, { stages, activeId });
}

function active(): Stage {
  return stages.find((s) => s.id === activeId) ?? stages[0];
}

/** active ステージを差し替えて再保存・通知する */
function updateActive(mut: (s: Stage) => Stage) {
  stages = stages.map((s) => (s.id === activeId ? mut(s) : s));
  persist();
  emit();
}

/* ---------------- 読み取り（ゲームロジック用・非リアクティブ） ---------------- */

export function tileAt(x: number, y: number): TileChar | null {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return null;
  return active().rows[y][x] as TileChar;
}
export function isWalkable(x: number, y: number): boolean {
  return !isBlocking(tileAt(x, y));
}

/* ---------------- React 用フック ---------------- */

export function useMapRows(): string[] {
  return useSyncExternalStore(subscribe, () => active().rows, () => active().rows);
}
export function useProps(): MapProp[] {
  return useSyncExternalStore(subscribe, () => active().props, () => active().props);
}
export function useStages(): Stage[] {
  return useSyncExternalStore(subscribe, () => stages, () => stages);
}
export function useActiveId(): string {
  return useSyncExternalStore(subscribe, () => activeId, () => activeId);
}
export function useAssets(): string[] {
  return useSyncExternalStore(subscribe, () => assets, () => assets);
}

/* ---------------- 編集（タイル / プロップ） ---------------- */

export function paintTile(x: number, y: number, ch: TileChar): void {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return;
  if (active().rows[y][x] === ch) return;
  updateActive((s) => {
    const rows = s.rows.slice();
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
    return { ...s, rows };
  });
}

/** そのタイルを初期状態に戻す（まち=既定マップのタイル、新ステージ=白） */
export function resetTile(x: number, y: number): void {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return;
  const base: TileChar = active().id === TOWN_ID ? (DEFAULT_MAP[y][x] as TileChar) : "N";
  paintTile(x, y, base);
}

export function addProp(p: MapProp): void {
  updateActive((s) => ({ ...s, props: [...s.props, p] }));
}
export function removeProp(id: string): void {
  updateActive((s) => ({ ...s, props: s.props.filter((p) => p.id !== id) }));
}
export function setPropWidth(id: string, w: number): void {
  const clamped = Math.max(1, Math.min(28, w));
  updateActive((s) => ({
    ...s,
    props: s.props.map((p) => (p.id === id ? { ...p, w: clamped } : p)),
  }));
}

/* ---------------- ステージ管理 ---------------- */

export function addStage(name: string): string {
  const id = uid();
  const stage: Stage = { id, name: name.trim() || `ステージ${stages.length}`, rows: blankRows(), props: [] };
  stages = [...stages, stage];
  activeId = id;
  persist();
  emit();
  return id;
}
export function setActiveStage(id: string): void {
  if (stages.some((s) => s.id === id)) {
    activeId = id;
    persist();
    emit();
  }
}
export function deleteStage(id: string): void {
  if (id === TOWN_ID) return; // まちは消さない
  stages = stages.filter((s) => s.id !== id);
  if (activeId === id) activeId = TOWN_ID;
  persist();
  emit();
}
export function renameStage(id: string, name: string): void {
  stages = stages.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s));
  persist();
  emit();
}

/** 現在ステージを初期化（まち=既定マップ、それ以外=真っ白） */
export function resetActive(): void {
  updateActive((s) => ({
    ...s,
    rows: s.id === TOWN_ID ? DEFAULT_MAP.slice() : blankRows(),
    props: [],
  }));
}

export function addAsset(src: string): void {
  const clean = src.trim();
  if (!clean) return;
  assets = dedupe([...assets, clean]);
  save(KEYS.assets, assets);
  emit();
}

/* ---------------- 操作キャラクター ---------------- */

export function useCharacter(): string {
  return useSyncExternalStore(subscribe, () => character, () => character);
}
/** 操作キャラの画像srcを設定（空文字＝既定のドット勇者に戻す） */
export function setCharacter(src: string): void {
  character = src;
  save("earnflow.character", character);
  emit();
}
