/**
 * 通知リマインダー。曜日ごとに通知時刻をオン/オフ＆設定できる。
 * （Service Worker を使わないため、タブを開いている間のみ発火する簡易版）
 */

import { useEffect, useSyncExternalStore } from "react";

export interface DayConfig {
  /** その曜日に通知するか */
  enabled: boolean;
  /** 通知時刻 "HH:MM" */
  time: string;
}

export interface ReminderSettings {
  /** 全体ON/OFF */
  enabled: boolean;
  /** 曜日ごとの設定。index 0=日 … 6=土 */
  days: DayConfig[];
}

/** 曜日ラベル（日〜土） */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const KEY = "earnflow.reminder";

function defaultDays(time = "18:00"): DayConfig[] {
  return Array.from({ length: 7 }, () => ({ enabled: true, time }));
}

function load(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ReminderSettings> & { time?: string };
      // 旧形式（enabled + time 単一）からの移行
      if (!Array.isArray(p.days)) {
        return { enabled: !!p.enabled, days: defaultDays(p.time ?? "18:00") };
      }
      const days = defaultDays();
      for (let i = 0; i < 7; i++) {
        const d = p.days[i];
        if (d) days[i] = { enabled: !!d.enabled, time: typeof d.time === "string" ? d.time : "18:00" };
      }
      return { enabled: !!p.enabled, days };
    }
  } catch {
    /* ignore */
  }
  return { enabled: false, days: defaultDays() };
}

let settings: ReminderSettings = load();
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function useReminder(): ReminderSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => settings,
    () => settings,
  );
}

/** 全体ON/OFF */
export function setReminderEnabled(enabled: boolean): void {
  settings = { ...settings, enabled };
  save();
  emit();
}

/** ある曜日の設定を更新（時刻/オンオフ） */
export function setDayConfig(day: number, patch: Partial<DayConfig>): void {
  if (day < 0 || day > 6) return;
  const days = settings.days.map((d, i) => (i === day ? { ...d, ...patch } : d));
  settings = { ...settings, days };
  save();
  emit();
}

/** 通知許可をリクエスト。許可されたら true */
export async function requestNotifyPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notifyBlocked(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "denied";
}

/**
 * 毎分チェックして、その曜日の設定時刻になったら通知を出すスケジューラ。
 * 同じ分に二重発火しないよう、最後に通知した "YYYY-MM-DD HH:MM" を記録する。
 */
export function useReminderScheduler(title: string, body: string): void {
  useEffect(() => {
    let last = "";
    const tick = () => {
      if (!settings.enabled) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const d = new Date();
      const cfg = settings.days[d.getDay()];
      if (!cfg || !cfg.enabled) return;
      const p = (n: number) => n.toString().padStart(2, "0");
      const hm = `${p(d.getHours())}:${p(d.getMinutes())}`;
      if (hm !== cfg.time) return;
      const stamp = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${hm}`;
      if (stamp === last) return;
      last = stamp;
      try {
        new Notification(title, { body });
      } catch {
        /* ignore */
      }
    };
    const id = window.setInterval(tick, 20_000); // 20秒ごとに確認
    tick();
    return () => window.clearInterval(id);
  }, [title, body]);
}
