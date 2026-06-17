/**
 * 勤務セッション履歴を CSV で書き出す（ダウンロード）。
 * Excel で文字化けしないよう BOM 付き・CRLF 区切りにする。
 */

import { getSessions, getWorkplaces } from "@/lib/store";
import { formatDuration } from "@/lib/utils";

function csvEscape(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** セッション履歴を CSV 文字列にする */
export function sessionsToCsv(): string {
  const workplaces = getWorkplaces();
  const nameOf = (id: string) => workplaces.find((w) => w.id === id)?.name ?? "";
  const sessions = getSessions().slice().sort((a, b) => a.startTime - b.startTime);

  const rows: string[][] = [["日付", "開始", "終了", "勤務時間", "収入(円)", "バイト先"]];
  for (const s of sessions) {
    rows.push([
      s.dateKey,
      fmtTime(s.startTime),
      fmtTime(s.endTime),
      formatDuration(s.durationSec),
      String(s.earnings),
      nameOf(s.workplaceId),
    ]);
  }
  return "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

/** CSV をダウンロードする。記録が無ければ false を返す */
export function downloadSessionsCsv(): boolean {
  if (getSessions().length === 0) return false;
  const csv = sessionsToCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, "0");
  const a = document.createElement("a");
  a.href = url;
  a.download = `earnflow_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
