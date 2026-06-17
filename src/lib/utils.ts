import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 簡易ID生成（crypto.randomUUID が無い環境向けのフォールバック付き） */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 円表記（記号 + カンマ区切り） */
export function formatYen(value: number, withSymbol = true): string {
  const rounded = Math.round(value);
  const s = rounded.toLocaleString("ja-JP");
  return withSymbol ? `¥${s}` : s;
}

/** 小数点以下も表示する円表記（カウンター用） */
export function formatYenPrecise(value: number, digits = 2): string {
  const fixed = value.toFixed(digits);
  const [intPart, decPart] = fixed.split(".");
  const intFmt = Number(intPart).toLocaleString("ja-JP");
  return decPart ? `${intFmt}.${decPart}` : intFmt;
}

/** 秒数を HH:MM:SS にフォーマット */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** 秒数を「X時間Y分」表記 */
export function formatDurationJa(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}分`;
  return `${h}時間${m}分`;
}

/** Date → YYYY-MM-DD（ローカルタイム基準） */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
