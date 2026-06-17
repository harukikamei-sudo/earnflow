import { useMemo, useState } from "react";
import { sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { getSessions } from "@/lib/store";
import { formatYen } from "@/lib/utils";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * 月別の稼ぎカレンダー。日別の収入をグリッド表示し、前月/翌月へ移動できる。
 * 家の中（インテリア）や /calendar ページで使う。
 */
export function CalendarBoard() {
  const [offset, setOffset] = useState(0); // 今月からの月数オフセット

  const view = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthSessions = sessionsInMonth(getSessions(), year, month);
    const byDay: Record<string, number> = {};
    for (const s of monthSessions) byDay[s.dateKey] = (byDay[s.dateKey] ?? 0) + s.earnings;
    return {
      year,
      month,
      total: sumEarnings(monthSessions),
      byDay,
      firstDow: new Date(year, month, 1).getDay(),
      days: new Date(year, month + 1, 0).getDate(),
    };
  }, [offset]);

  const cells: (number | null)[] = [
    ...Array.from({ length: view.firstDow }, () => null),
    ...Array.from({ length: view.days }, (_, i) => i + 1),
  ];

  return (
    <div className="font-pixel">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setOffset((o) => o - 1)} className="rounded bg-white/10 px-2 py-1 text-sm text-white hover:bg-white/20">◀</button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{view.year}年 {view.month + 1}月</p>
          <p className="text-[11px] text-gold">合計 {formatYen(view.total)}</p>
        </div>
        <button type="button" onClick={() => setOffset((o) => o + 1)} className="rounded bg-white/10 px-2 py-1 text-sm text-white hover:bg-white/20">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEK.map((w, i) => (
          <div key={w} className={i === 0 ? "text-[10px] text-red-400" : i === 6 ? "text-[10px] text-blue-300" : "text-[10px] text-white/60"}>
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const key = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
          const earned = view.byDay[key] ?? 0;
          return (
            <div
              key={key}
              className={
                "flex aspect-square flex-col items-center justify-center rounded-sm " +
                (earned > 0 ? "bg-gold/20 ring-1 ring-gold/40" : "bg-white/5")
              }
            >
              <span className="text-[10px] text-white/80">{day}</span>
              {earned > 0 && <span className="text-[8px] font-bold leading-tight text-gold">{formatYen(earned, false)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
