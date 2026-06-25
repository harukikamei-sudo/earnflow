/**
 * バイトの予定（シフト）。日付＋時刻＋メモを登録し、カレンダーに表示。
 * 開始1時間前にブラウザ通知でリマインドする（タブを開いている間に発火する簡易版）。
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { uid } from "@/lib/utils";

export interface Shift {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" */
  time: string;
  /** バイト名・メモ */
  label?: string;
}

const KEY = "earnflow.shifts";
const NOTIFIED_KEY = "earnflow.shiftsNotified";

function load<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(k: string, v: T): void {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

let shifts: Shift[] = load<Shift[]>(KEY, []);
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  save(KEY, shifts);
  emit();
}

export function useShifts(): Shift[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => shifts,
    () => shifts,
  );
}

export function addShift(date: string, time: string, label?: string): void {
  if (!date || !time) return;
  shifts = [...shifts, { id: uid(), date, time, label: label?.trim() || undefined }];
  shifts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  persist();
}

export function removeShift(id: string): void {
  shifts = shifts.filter((s) => s.id !== id);
  persist();
}

/** その月(year, month0)のシフトを日付キー→件数でまとめる（カレンダー表示用） */
export function shiftDatesInMonth(year: number, month0: number): Set<string> {
  const set = new Set<string>();
  for (const s of shifts) {
    const d = new Date(`${s.date}T00:00:00`);
    if (d.getFullYear() === year && d.getMonth() === month0) set.add(s.date);
  }
  return set;
}

/**
 * 開始1時間前にリマインド通知を出すスケジューラ。
 * bodyFor で本文を組み立てる（多言語対応のため呼び出し側から渡す）。
 */
export function useShiftReminder(title: string, bodyFor: (s: Shift) => string): void {
  const bodyRef = useRef(bodyFor);
  bodyRef.current = bodyFor;
  useEffect(() => {
    const notified: Record<string, boolean> = load<Record<string, boolean>>(NOTIFIED_KEY, {});
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = Date.now();
      for (const s of shifts) {
        const dt = new Date(`${s.date}T${s.time}:00`).getTime();
        if (Number.isNaN(dt)) continue;
        const remindAt = dt - 3_600_000; // 1時間前
        if (now >= remindAt && now < dt && !notified[s.id]) {
          notified[s.id] = true;
          save(NOTIFIED_KEY, notified);
          try {
            new Notification(title, { body: bodyRef.current(s) });
          } catch {
            /* ignore */
          }
        }
      }
    };
    const id = window.setInterval(tick, 30_000);
    tick();
    return () => window.clearInterval(id);
  }, [title]);
}
