import { useMemo, useState } from "react";
import { sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { getSessions } from "@/lib/store";
import { addShift, removeShift, shiftDatesInMonth, useShifts } from "@/game/shifts";
import { requestNotifyPermission } from "@/game/reminder";
import { playSE } from "@/audio/engine";
import { formatYen } from "@/lib/utils";
import { useT } from "@/i18n";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * 月別カレンダー。日別の収入を表示し、日付をタップするとその日の予定（シフト）を
 * 追加・削除できる。家の中（インテリア）や /calendar ページで使う。
 */
export function CalendarBoard() {
  const t = useT();
  const [offset, setOffset] = useState(0); // 今月からの月数オフセット
  const shifts = useShifts(); // 予定の変化で再描画
  const [selected, setSelected] = useState<string | null>(null);
  const [time, setTime] = useState("09:00");
  const [label, setLabel] = useState("");

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
      shiftDays: shiftDatesInMonth(year, month),
      firstDow: new Date(year, month, 1).getDay(),
      days: new Date(year, month + 1, 0).getDate(),
    };
  }, [offset]);

  const cells: (number | null)[] = [
    ...Array.from({ length: view.firstDow }, () => null),
    ...Array.from({ length: view.days }, (_, i) => i + 1),
  ];

  const daysShifts = selected ? shifts.filter((s) => s.date === selected) : [];

  async function addForSelected() {
    if (!selected || !time) return;
    addShift(selected, time, label);
    playSE("confirm");
    setLabel("");
    await requestNotifyPermission();
  }

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
          const hasShift = view.shiftDays.has(key);
          const isSel = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                playSE("confirm");
                setSelected(key);
              }}
              className={
                "relative flex aspect-square flex-col items-center justify-center rounded-sm transition-colors " +
                (isSel
                  ? "bg-gold/40 ring-2 ring-gold"
                  : earned > 0
                    ? "bg-gold/20 ring-1 ring-gold/40"
                    : hasShift
                      ? "bg-sky-400/20 ring-1 ring-sky-300/50"
                      : "bg-white/5 hover:bg-white/15")
              }
            >
              {hasShift && <span className="absolute right-0.5 top-0 text-[8px]">📌</span>}
              <span className="text-[10px] text-white/80">{day}</span>
              {earned > 0 && <span className="text-[8px] font-bold leading-tight text-gold">{formatYen(earned, false)}</span>}
            </button>
          );
        })}
      </div>

      {/* 選択日の予定エディタ */}
      {selected && (
        <div className="anim-dq-pop mt-3 rounded-md bg-white/5 p-2">
          <div className="mb-2 flex items-center justify-between text-sm text-white">
            <span className="font-bold text-gold">📌 {selected}</span>
            <button type="button" onClick={() => setSelected(null)} className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/70 hover:bg-white/20">×</button>
          </div>

          {/* その日の予定一覧 */}
          {daysShifts.length > 0 && (
            <div className="mb-2 flex flex-col gap-1">
              {daysShifts.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1 text-[11px] text-white">
                  <span className="text-gold">{s.time}</span>
                  <span className="flex-1 truncate">{s.label ?? t("shift.work")}</span>
                  <button type="button" onClick={() => removeShift(s.id)} className="px-1 text-red-400">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* 追加フォーム */}
          <div className="flex items-center gap-2 text-sm text-white">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded bg-white/10 px-2 py-1 text-white" />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("shift.labelPlaceholder")}
              maxLength={16}
              className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/40"
            />
            <button type="button" onClick={addForSelected} className="shrink-0 rounded bg-gold px-3 py-1 text-[11px] font-bold text-black">＋</button>
          </div>
          <p className="mt-1 text-[10px] text-white/40">{t("shift.note")}</p>
        </div>
      )}
    </div>
  );
}
