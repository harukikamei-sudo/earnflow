import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { getGoal, getWorkplaces, saveGoal } from "@/lib/store";
import { formatYen } from "@/lib/utils";

function averageHourly(): number {
  const hourly = getWorkplaces().filter((w) => w.payType === "hourly" && w.hourlyRate > 0);
  if (hourly.length === 0) return 1100;
  return Math.round(hourly.reduce((a, w) => a + w.hourlyRate, 0) / hourly.length);
}
function fmtHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/**
 * 目標収入（ノルマ）の設定＆逆算。月/年の目標と出勤日数から
 * 1日いくら・何時間働けばよいかを計算する。家の中で使う。
 */
export function GoalSettings() {
  const initial = getGoal();
  const [monthly, setMonthly] = useState(String(initial.monthlyTarget || ""));
  const [yearly, setYearly] = useState(String(initial.yearlyTarget || ""));
  const [workDays, setWorkDays] = useState(String(initial.workDaysPerMonth || 20));
  const [saved, setSaved] = useState(false);
  const avgHourly = useMemo(() => averageHourly(), []);

  const m = Number(monthly) || 0;
  const y = Number(yearly) || 0;
  const d = Math.max(1, Number(workDays) || 20);
  const perDayM = m / d;
  const perDayY = y / 12 / d;

  function handleSave() {
    saveGoal({ monthlyTarget: m, yearlyTarget: y, workDaysPerMonth: d });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  const field = (label: string, value: string, set: (v: string) => void, suffix: string, onBlur?: () => void) => (
    <label className="flex items-center justify-between gap-2 font-pixel text-sm text-white">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => set(e.target.value)}
          onBlur={onBlur}
          className="tabular h-9 w-28 text-right font-bold"
        />
        <span className="w-10 text-[11px] text-white/60">{suffix}</span>
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-2">
      {field("月の目標", monthly, setMonthly, "円/月", () => m > 0 && setYearly(String(m * 12)))}
      {field("年の目標", yearly, setYearly, "円/年", () => y > 0 && setMonthly(String(Math.round(y / 12))))}
      {field("出勤日数", workDays, setWorkDays, "日/月")}
      <p className="font-pixel text-[11px] text-white/60">
        平均時給 <span className="text-gold">{formatYen(avgHourly)}</span> で逆算
      </p>

      {(m > 0 || y > 0) && (
        <div className="mt-1 grid grid-cols-2 gap-2">
          {m > 0 && (
            <div className="rounded bg-white/5 p-2 font-pixel">
              <p className="text-[10px] text-white/60">月目標 → 1日あたり</p>
              <p className="text-lg font-black text-gold-gradient">{formatYen(perDayM)}</p>
              <p className="text-[11px] text-white/70">≒ {fmtHours(perDayM / avgHourly)}/日</p>
            </div>
          )}
          {y > 0 && (
            <div className="rounded bg-white/5 p-2 font-pixel">
              <p className="text-[10px] text-white/60">年目標 → 1日あたり</p>
              <p className="text-lg font-black text-gold-gradient">{formatYen(perDayY)}</p>
              <p className="text-[11px] text-white/70">≒ {fmtHours(perDayY / avgHourly)}/日</p>
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={handleSave} className="font-pixel mt-1 rounded bg-gold py-1.5 text-sm font-bold text-black">
        {saved ? "保存しました ✓" : "ノルマを保存"}
      </button>
    </div>
  );
}
