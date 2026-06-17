import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { getSessions } from "@/lib/store";
import { formatYen } from "@/lib/utils";

/**
 * 直近6か月の月別収入を棒グラフで表示する（家の中で確認）。
 */
export function EarningsChart() {
  const data = useMemo(() => {
    const now = new Date();
    const sessions = getSessions();
    const arr: { label: string; total: number; current: boolean }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const total = sumEarnings(sessionsInMonth(sessions, d.getFullYear(), d.getMonth()));
      arr.push({ label: `${d.getMonth() + 1}月`, total, current: i === 0 });
    }
    return arr;
  }, []);

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="font-pixel">
      <div style={{ width: "100%", height: 168 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#cbd0dd" }} axisLine={{ stroke: "#ffffff55" }} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.08)" }}
              contentStyle={{ background: "#0a0c1c", border: "2px solid #fff", borderRadius: 8, fontFamily: "DotGothic16" }}
              labelStyle={{ color: "#f6c945" }}
              formatter={(v) => [formatYen(Number(v) || 0), "収入"]}
            />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.current ? "#f6c945" : "#8a6a1f"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!hasData && <p className="mt-1 text-center text-[11px] text-white/50">まだ収入の記録がありません。はたらいてみよう！</p>}
    </div>
  );
}
