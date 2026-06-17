import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { createWorkplace, makeTimeRule, RULE_PRESETS } from "@/game/workplace";
import type { TimeRule, Workplace } from "@/lib/types";
import { cn, formatYen } from "@/lib/utils";

interface WorkMenuProps {
  workplaces: Workplace[];
  onStart: (wp: Workplace) => void;
  onAdd: (wp: Workplace) => void;
  onDelete: (id: string) => void;
}

/** バイト先に接近したときに出る選択ウィンドウ（複数選択・追加・削除）。 */
export function WorkMenu({ workplaces, onStart, onAdd, onDelete }: WorkMenuProps) {
  const [selectedId, setSelectedId] = useState(workplaces[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("1100");
  const [rules, setRules] = useState<TimeRule[]>([makeTimeRule("深夜割増", 22, 5, 1.25)]);
  // カスタム時間帯ルール入力
  const [cStart, setCStart] = useState("22");
  const [cEnd, setCEnd] = useState("5");
  const [cMul, setCMul] = useState("1.25");

  // 選択中が消えていたら先頭にフォールバック（state は更新せず描画時に解決）
  const selected = workplaces.find((w) => w.id === selectedId) ?? workplaces[0] ?? null;
  const showAdd = adding || workplaces.length === 0;

  function addPreset(p: (typeof RULE_PRESETS)[number]) {
    setRules((rs) => [...rs, makeTimeRule(p.label, p.startHour, p.endHour, p.multiplier)]);
  }
  function addCustomRule() {
    const s = Number(cStart);
    const e = Number(cEnd);
    const m = Number(cMul);
    if (![s, e].every((v) => Number.isInteger(v) && v >= 0 && v <= 23) || !(m > 0)) return;
    setRules((rs) => [...rs, makeTimeRule(`${s}時〜${e}時`, s, e, m)]);
  }
  function removeRule(id: string) {
    setRules((rs) => rs.filter((r) => r.id !== id));
  }

  function submitAdd() {
    const r = Number(rate);
    if (!name.trim() || !Number.isFinite(r) || r <= 0) return;
    const wp = createWorkplace(name.trim(), r, rules);
    onAdd(wp);
    setSelectedId(wp.id);
    setAdding(false);
    setName("");
    setRate("1100");
    setRules([makeTimeRule("深夜割増", 22, 5, 1.25)]);
  }

  return (
    <DQWindow title="¥バイト" className="anim-dq-pop max-h-[70vh] overflow-y-auto no-scrollbar">
      <p className="font-pixel mb-2 text-sm text-white">どの バイトで はたらく？</p>

      {/* バイト一覧 */}
      <div className="mb-2 flex flex-col gap-1">
        {workplaces.map((w) => {
          const isSel = w.id === selected?.id;
          const m = w.timeRules.length > 0;
          return (
            <div key={w.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedId(w.id)}
                className={cn(
                  "font-pixel flex flex-1 items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors",
                  isSel ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
                )}
              >
                <span className="flex items-center gap-1">
                  <span className={cn("w-3", isSel ? "" : "opacity-0")}>▶</span>
                  {w.name}
                </span>
                <span className="text-xs opacity-80">
                  {formatYen(w.hourlyRate)}/時{m ? " 🌙" : ""}
                </span>
              </button>
              <button
                type="button"
                aria-label="削除"
                onClick={() => onDelete(w.id)}
                className="font-pixel rounded px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* 追加フォーム */}
      {showAdd ? (
        <div className="mb-2 flex flex-col gap-2 rounded bg-white/5 p-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="バイト名（例: コンビニ）"
            className="h-10 text-sm"
            maxLength={16}
          />
          <div className="flex items-center gap-2">
            <label className="font-pixel text-sm">時給</label>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="tabular h-10 pl-7 text-right font-bold"
              />
            </div>
          </div>

          {/* 時間帯割増ルール */}
          <p className="font-pixel text-[11px] text-white/60">時間帯の割増（深夜・早朝など）</p>
          {rules.length > 0 && (
            <div className="flex flex-col gap-1">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1 font-pixel text-[11px] text-white">
                  <span className="flex-1 truncate">{r.label}</span>
                  <span className="text-white/60">{r.startHour}時〜{r.endHour}時</span>
                  <span className="text-gold">×{r.multiplier}</span>
                  <button type="button" onClick={() => removeRule(r.id)} className="px-1 text-red-400">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {RULE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => addPreset(p)}
                className="font-pixel rounded bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
              >
                ＋{p.label} ×{p.multiplier}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 font-pixel text-[11px] text-white">
            <Input type="number" min={0} max={23} value={cStart} onChange={(e) => setCStart(e.target.value)} className="tabular h-8 w-12 text-center" />
            <span>時〜</span>
            <Input type="number" min={0} max={23} value={cEnd} onChange={(e) => setCEnd(e.target.value)} className="tabular h-8 w-12 text-center" />
            <span>時 ×</span>
            <Input type="number" min={1} step={0.05} value={cMul} onChange={(e) => setCMul(e.target.value)} className="tabular h-8 w-14 text-center" />
            <button type="button" onClick={addCustomRule} className="font-pixel rounded bg-white/15 px-2 py-1 hover:bg-white/25">追加</button>
          </div>

          <div className="flex gap-2">
            <DQCommand label="ついかする" active accent="gold" onClick={submitAdd} />
            {workplaces.length > 0 && <DQCommand label="やめる" onClick={() => setAdding(false)} />}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="font-pixel mb-2 w-full rounded border border-dashed border-white/30 px-2 py-1.5 text-sm text-white/70 hover:bg-white/10"
        >
          ＋ あたらしい バイトを ついか
        </button>
      )}

      <DQCommand
        label="はたらく！"
        active
        accent="gold"
        disabled={!selected}
        onClick={() => selected && onStart(selected)}
      />
    </DQWindow>
  );
}
