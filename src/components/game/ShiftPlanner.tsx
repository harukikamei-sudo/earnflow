import { useState } from "react";
import { DQWindow, DQCommand } from "@/components/pixel/DQWindow";
import { addShift, removeShift, useShifts } from "@/game/shifts";
import { requestNotifyPermission } from "@/game/reminder";
import { playSE } from "@/audio/engine";
import { toDateKey } from "@/lib/utils";
import { useT } from "@/i18n";

/** バイトの予定（シフト）をカレンダーに登録する。開始1時間前に通知される。 */
export function ShiftPlanner() {
  const t = useT();
  const shifts = useShifts();
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [time, setTime] = useState("09:00");
  const [label, setLabel] = useState("");

  const todayKey = toDateKey(new Date());
  const upcoming = shifts.filter((s) => s.date >= todayKey);

  async function submit() {
    if (!date || !time) return;
    addShift(date, time, label);
    playSE("confirm");
    setLabel("");
    // 通知許可をお願いする（1時間前リマインドのため）
    await requestNotifyPermission();
  }

  return (
    <DQWindow title={t("shift.title")}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between font-pixel text-sm text-white">
          <span>{t("manual.date")}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="font-pixel rounded bg-white/10 px-2 py-1 text-white"
          />
        </div>
        <div className="flex items-center justify-between font-pixel text-sm text-white">
          <span>{t("rem.time")}</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="font-pixel rounded bg-white/10 px-2 py-1 text-white"
          />
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("shift.labelPlaceholder")}
          maxLength={16}
          className="font-pixel rounded bg-white/10 px-2 py-2 text-sm text-white placeholder:text-white/40"
        />
        <DQCommand label={t("shift.add")} active accent="gold" onClick={submit} />
        <p className="font-pixel text-[10px] text-white/40">{t("shift.note")}</p>

        {/* これからの予定 */}
        <p className="font-pixel mt-1 text-xs text-gold">📌 {t("shift.upcoming")}</p>
        {upcoming.length === 0 ? (
          <p className="font-pixel text-[11px] text-white/50">{t("shift.none")}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1 font-pixel text-[11px] text-white">
                <span className="text-white/70">{s.date}</span>
                <span className="text-gold">{s.time}</span>
                <span className="flex-1 truncate">{s.label ?? t("shift.work")}</span>
                <button type="button" onClick={() => removeShift(s.id)} className="px-1 text-red-400">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DQWindow>
  );
}
