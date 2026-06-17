import { useMemo, useState } from "react";
import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGoal, getWorkplaces, saveGoal } from "@/lib/store";
import { formatYen } from "@/lib/utils";

/** 平均時給（時給制バイトの平均。無ければ 1100） */
function averageHourly(): number {
  const hourly = getWorkplaces().filter((w) => w.payType === "hourly" && w.hourlyRate > 0);
  if (hourly.length === 0) return 1100;
  return Math.round(hourly.reduce((a, w) => a + w.hourlyRate, 0) / hourly.length);
}

/** 時間(数値) → 「X時間Y分」 */
function fmtHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/**
 * 目標収入の設定＆逆算ページ。
 * 月／年の目標額と出勤日数から「1日いくら・何時間働けばいいか」を計算する。
 */
export default function Presets() {
  const initial = getGoal();
  const [monthly, setMonthly] = useState(String(initial.monthlyTarget || ""));
  const [yearly, setYearly] = useState(String(initial.yearlyTarget || ""));
  const [workDays, setWorkDays] = useState(String(initial.workDaysPerMonth || 20));
  const [saved, setSaved] = useState(false);

  const avgHourly = useMemo(() => averageHourly(), []);

  const m = Number(monthly) || 0;
  const y = Number(yearly) || 0;
  const d = Math.max(1, Number(workDays) || 20);

  // 月目標からの逆算
  const perDayFromMonthly = m / d;
  const hoursFromMonthly = perDayFromMonthly / avgHourly;
  // 年目標からの逆算
  const monthlyFromYearly = y / 12;
  const perDayFromYearly = monthlyFromYearly / d;
  const hoursFromYearly = perDayFromYearly / avgHourly;

  function handleSave() {
    saveGoal({ monthlyTarget: m, yearlyTarget: y, workDaysPerMonth: d });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function syncYearFromMonth() {
    if (m > 0) setYearly(String(m * 12));
  }
  function syncMonthFromYear() {
    if (y > 0) setMonthly(String(Math.round(y / 12)));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/30">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">目標収入</h1>
          <p className="text-sm text-muted-foreground">1日どれだけ働けばいいか逆算</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <Field label="月の目標額" value={monthly} onChange={setMonthly} onBlur={syncYearFromMonth} suffix="円/月" />
          <Field label="年の目標額" value={yearly} onChange={setYearly} onBlur={syncMonthFromYear} suffix="円/年" />
          <Field label="月の出勤日数" value={workDays} onChange={setWorkDays} suffix="日/月" />
          <p className="text-xs text-muted-foreground">
            平均時給 <span className="font-bold text-gold">{formatYen(avgHourly)}</span>（登録バイトから算出）で時間を逆算します
          </p>
          <Button onClick={handleSave}>{saved ? "保存しました ✓" : "保存する"}</Button>
        </CardContent>
      </Card>

      {m > 0 && (
        <ResultCard
          title="月目標から"
          target={`${formatYen(m)} / 月`}
          perDay={perDayFromMonthly}
          hours={hoursFromMonthly}
          days={d}
        />
      )}
      {y > 0 && (
        <ResultCard
          title="年目標から"
          target={`${formatYen(y)} / 年（月 ${formatYen(monthlyFromYearly)}）`}
          perDay={perDayFromYearly}
          hours={hoursFromYearly}
          days={d}
        />
      )}

      {m <= 0 && y <= 0 && (
        <p className="text-center text-sm text-muted-foreground">
          目標額を入力すると、1日あたりの必要額と必要時間が表示されます。
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  suffix: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold">{label}</span>
      <span className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="tabular h-11 w-32 text-right font-bold"
        />
        <span className="w-12 text-xs text-muted-foreground">{suffix}</span>
      </span>
    </label>
  );
}

function ResultCard({
  title,
  target,
  perDay,
  hours,
  days,
}: {
  title: string;
  target: string;
  perDay: number;
  hours: number;
  days: number;
}) {
  return (
    <Card className="gold-glow">
      <CardContent className="flex flex-col gap-2 py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gold">{title}</p>
        <p className="text-sm text-muted-foreground">{target}</p>
        <div className="mt-1 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">1日あたり（{days}日勤務）</p>
            <p className="tabular text-3xl font-black text-gold-gradient">{formatYen(perDay)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">1日の労働時間</p>
            <p className="text-2xl font-black">{fmtHours(hours)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
