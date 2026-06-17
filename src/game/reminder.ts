/**
 * 通知リマインダー。毎日指定時刻に「はたらこう」とブラウザ通知を出す。
 * （Service Worker を使わないため、タブを開いている間のみ発火する簡易版）
 */

import { useEffect, useSyncExternalStore } from "react";

export interface ReminderSettings {
  enabled: boolean;
  /** "HH:MM" */
  time: string;
}

const KEY = "earnflow.reminder";

function load(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { enabled: false, time: "20:00", ...(JSON.parse(raw) as Partial<ReminderSettings>) };
  } catch {
    /* ignore */
  }
  return { enabled: false, time: "20:00" };
}

let settings: ReminderSettings = load();
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
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

export function setReminder(next: Partial<ReminderSettings>): void {
  settings = { ...settings, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
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
 * 毎分チェックして、設定時刻になったら通知を出すスケジューラ（フック）。
 * 同じ分に二重発火しないよう、最後に通知した "YYYY-MM-DD HH:MM" を記録する。
 */
export function useReminderScheduler(title: string, body: string): void {
  useEffect(() => {
    let last = "";
    const tick = () => {
      if (!settings.enabled) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const d = new Date();
      const p = (n: number) => n.toString().padStart(2, "0");
      const hm = `${p(d.getHours())}:${p(d.getMinutes())}`;
      if (hm !== settings.time) return;
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
