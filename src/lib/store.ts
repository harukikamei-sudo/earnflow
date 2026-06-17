/**
 * localStorage ベースの永続化レイヤ。
 *
 * 後でバックエンド（Supabase / Firebase / Base44 等）に差し替える場合は、
 * このファイルの read/write 関数だけを置き換えれば UI 側は変更不要。
 */

import type { Goal, Session, Workplace } from "./types";

const KEYS = {
  workplaces: "earnflow.workplaces",
  sessions: "earnflow.sessions",
  goal: "earnflow.goal",
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ストレージ満杯やプライベートモード等は握りつぶす（dev scaffold のため）
  }
}

/* ---------------- Workplaces ---------------- */

export function getWorkplaces(): Workplace[] {
  return readJSON<Workplace[]>(KEYS.workplaces, []);
}

export function saveWorkplaces(list: Workplace[]): void {
  writeJSON(KEYS.workplaces, list);
}

export function upsertWorkplace(wp: Workplace): Workplace[] {
  const list = getWorkplaces();
  const idx = list.findIndex((w) => w.id === wp.id);
  if (idx >= 0) list[idx] = wp;
  else list.push(wp);
  saveWorkplaces(list);
  return list;
}

export function deleteWorkplace(id: string): Workplace[] {
  const list = getWorkplaces().filter((w) => w.id !== id);
  saveWorkplaces(list);
  return list;
}

/* ---------------- Sessions ---------------- */

export function getSessions(): Session[] {
  return readJSON<Session[]>(KEYS.sessions, []);
}

export function saveSessions(list: Session[]): void {
  writeJSON(KEYS.sessions, list);
}

export function addSession(session: Session): Session[] {
  const list = getSessions();
  list.push(session);
  saveSessions(list);
  return list;
}

export function deleteSession(id: string): Session[] {
  const list = getSessions().filter((s) => s.id !== id);
  saveSessions(list);
  return list;
}

/* ---------------- Goal ---------------- */

export function getGoal(): Goal {
  return readJSON<Goal>(KEYS.goal, { monthlyTarget: 0 });
}

export function saveGoal(goal: Goal): void {
  writeJSON(KEYS.goal, goal);
}
