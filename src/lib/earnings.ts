/**
 * 収入計算ロジック（アプリの心臓部）。
 *
 * 時給制: 1 秒ごとに「時給 / 3600 × その時刻の倍率」を加算。
 *         時間帯別倍率（深夜割増など）に対応するため、区間ごとに積分する。
 * 日給制: 稼働した時点で日給を満額計上（按分しないシンプル版）。
 */

import type { Session, TimeRule, Workplace } from "./types";
import { isHoliday } from "./holiday";
import { toDateKey, uid } from "./utils";

/** 指定時刻(Date)に適用される最大倍率を返す。該当ルールが無ければ 1.0 */
export function multiplierAt(date: Date, rules: TimeRule[]): number {
  const hour = date.getHours() + date.getMinutes() / 60;
  let best = 1;
  for (const r of rules) {
    if (isHourInRule(hour, r.startHour, r.endHour)) {
      best = Math.max(best, r.multiplier);
    }
  }
  return best;
}

/** hour(0-24) がルール区間内か。endHour <= startHour の場合は日跨ぎとして扱う */
function isHourInRule(hour: number, startHour: number, endHour: number): boolean {
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  // 日跨ぎ（例: 22時〜5時）
  return hour >= startHour || hour < endHour;
}

/**
 * [start, end) 区間（epoch ms）の時給収入を計算。
 * 倍率が時間帯で変わるため、1 分刻みで積分する（誤差は無視できる範囲）。
 * holidayBonus を渡すと、土日・祝日の分は時給に上乗せする（時間帯倍率はその合計に掛かる）。
 */
export function hourlyEarnings(
  startMs: number,
  endMs: number,
  hourlyRate: number,
  rules: TimeRule[],
  holidayBonus = 0,
): number {
  if (endMs <= startMs || hourlyRate <= 0) return 0;
  const stepMs = 60_000; // 1 分刻み
  let total = 0;
  for (let t = startMs; t < endMs; t += stepMs) {
    const segEnd = Math.min(t + stepMs, endMs);
    const segSec = (segEnd - t) / 1000;
    const d = new Date(t);
    const rate = hourlyRate + (holidayBonus > 0 && isHoliday(d) ? holidayBonus : 0);
    const m = multiplierAt(d, rules);
    total += (rate / 3600) * segSec * m;
  }
  return total;
}

/** 現在の稼働中セッションの収入をリアルタイム計算 */
export function currentEarnings(
  wp: Workplace,
  startMs: number,
  nowMs: number,
): number {
  if (wp.payType === "daily") {
    // 日給制: 稼働開始した時点で満額（按分しない）。休日は追加分を上乗せ
    if (nowMs <= startMs) return 0;
    const bonus = (wp.holidayBonus ?? 0) > 0 && isHoliday(new Date(startMs)) ? wp.holidayBonus! : 0;
    return wp.dailyRate + bonus;
  }
  return hourlyEarnings(startMs, nowMs, wp.hourlyRate, wp.timeRules, wp.holidayBonus ?? 0);
}

/** 稼働終了時に確定セッションを生成 */
export function finalizeSession(
  wp: Workplace,
  startMs: number,
  endMs: number,
): Session {
  const durationSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const earnings = currentEarnings(wp, startMs, endMs);
  return {
    id: uid(),
    workplaceId: wp.id,
    startTime: startMs,
    endTime: endMs,
    durationSec,
    earnings: Math.round(earnings),
    dateKey: toDateKey(new Date(startMs)),
  };
}

/** セッション配列から合計収入を算出 */
export function sumEarnings(sessions: Session[]): number {
  return sessions.reduce((acc, s) => acc + s.earnings, 0);
}

/** 指定年月(0-indexed month)のセッションを抽出 */
export function sessionsInMonth(
  sessions: Session[],
  year: number,
  month: number,
): Session[] {
  return sessions.filter((s) => {
    const d = new Date(s.startTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
