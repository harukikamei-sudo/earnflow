import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { createWorkplace, makeTimeRule, RULE_PRESETS } from "@/game/workplace";
import type { PayType, TimeRule, Workplace } from "@/lib/types";
import { cn, formatYen } from "@/lib/utils";

/** 給与タイプの一覧（ラベル・単位） */
const PAY_TYPES: { key: PayType; label: string; unit: string }[] = [
  { key: "hourly", label: "時給", unit: "/時" },
  { key: "daily", label: "日給", unit: "/日" },
  { key: "monthly", label: "月給", unit: "/月" },
  { key: "annual", label: "年俸", unit: "/年" },
];
/** その勤務先の金額と単位を返す */
function payOf(w: Workplace): { amount: number; unit: string } {
  switch (w.payType) {
    case "daily":
      return { amount: w.dailyRate, unit: "/日" };
    case "monthly":
      return { amount: w.monthlyRate ?? 0, unit: "/月" };
    case "annual":
      return { amount: w.annualRate ?? 0, unit: "/年" };
    default:
      return { amount: w.hourlyRate, unit: "/時" };
  }
}

interface WorkMenuProps {
  workplaces: Workplace[];
  onStart: (wp: Workplace) => void;
  onAdd: (wp: Workplace) => void;
  onUpdate: (wp: Workplace) => void;
  onDelete: (id: string) => void;
}

/** バイト先に接近したときに出る選択ウィンドウ（複数選択・追加・編集・削除）。 */
export function WorkMenu({ workplaces, onStart, onAdd, onUpdate, onDelete }: WorkMenuProps) {
  const [selectedId, setSelectedId] = useState(workplaces[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  /** 編集中のバイトID（null＝新規追加） */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [payType, setPayType] = useState<PayType>("hourly");
  const [amount, setAmount] = useState("1100");
  const [holiday, setHoliday] = useState("0");
  const [rules, setRules] = useState<TimeRule[]>([makeTimeRule("深夜割増", 22, 5, 1.25)]);
  // カスタム時間帯ルール入力
  const [cStart, setCStart] = useState("22");
  const [cEnd, setCEnd] = useState("5");
  const [cMul, setCMul] = useState("1.25");

  // 選択中が消えていたら先頭にフォールバック（state は更新せず描画時に解決）
  const selected = workplaces.find((w) => w.id === selectedId) ?? workplaces[0] ?? null;
  const showForm = adding || editingId !== null || workplaces.length === 0;

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

  function resetForm() {
    setAdding(false);
    setEditingId(null);
    setName("");
    setPayType("hourly");
    setAmount("1100");
    setHoliday("0");
    setRules([makeTimeRule("深夜割増", 22, 5, 1.25)]);
  }

  /** 既存バイトを編集モードで開く（値をフォームへ流し込む） */
  function startEdit(w: Workplace) {
    setEditingId(w.id);
    setAdding(false);
    setName(w.name);
    setPayType(w.payType);
    setAmount(String(payOf(w).amount));
    setHoliday(String(w.holidayBonus ?? 0));
    setRules(w.timeRules.map((r) => ({ ...r })));
  }

  function submitForm() {
    const a = Number(amount);
    if (!name.trim() || !Number.isFinite(a) || a <= 0) return;
    const hb = Number(holiday);
    // 休日追加は時給・日給のみ、時間帯割増は時給のみ
    const bonus = (payType === "hourly" || payType === "daily") && Number.isFinite(hb) && hb > 0 ? hb : 0;
    const useRules = payType === "hourly" ? rules : [];
    if (editingId) {
      const orig = workplaces.find((w) => w.id === editingId);
      if (!orig) return;
      const wp: Workplace = {
        ...orig,
        name: name.trim(),
        payType,
        hourlyRate: payType === "hourly" ? a : 0,
        dailyRate: payType === "daily" ? a : 0,
        monthlyRate: payType === "monthly" ? a : 0,
        annualRate: payType === "annual" ? a : 0,
        holidayBonus: bonus,
        timeRules: useRules,
      };
      onUpdate(wp);
      setSelectedId(wp.id);
    } else {
      const wp = createWorkplace(name.trim(), payType, a, useRules, bonus);
      onAdd(wp);
      setSelectedId(wp.id);
    }
    resetForm();
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
                  {formatYen(payOf(w).amount)}{payOf(w).unit}{m ? " 🌙" : ""}{(w.holidayBonus ?? 0) > 0 ? " 🎌" : ""}
                </span>
              </button>
              <button
                type="button"
                aria-label="編集"
                onClick={() => startEdit(w)}
                className={cn(
                  "font-pixel rounded px-2 py-1 text-xs hover:bg-white/10",
                  editingId === w.id ? "text-gold" : "text-white/50 hover:text-gold",
                )}
              >
                ✎
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

      {/* 追加 / 編集フォーム */}
      {showForm ? (
        <div className="mb-2 flex flex-col gap-2 rounded bg-white/5 p-2">
          {editingId && (
            <p className="font-pixel text-[11px] text-gold">✎ バイトの内容を編集</p>
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="バイト名（例: コンビニ）"
            className="h-10 text-sm"
            maxLength={16}
          />
          {/* 給与タイプ */}
          <div className="flex gap-1">
            {PAY_TYPES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPayType(p.key)}
                className={cn(
                  "font-pixel flex-1 rounded px-1 py-1.5 text-xs transition-colors",
                  payType === p.key ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="font-pixel text-sm whitespace-nowrap">
              {PAY_TYPES.find((p) => p.key === payType)?.label}
            </label>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular h-10 pl-7 text-right font-bold"
              />
            </div>
          </div>
          {(payType === "monthly" || payType === "annual") && (
            <p className="font-pixel -mt-1 text-[10px] text-white/50">
              月160時間想定で時給換算してリアルタイム計上します
            </p>
          )}

          {/* 休日（土日・祝日）の追加時給：時給・日給のみ */}
          {(payType === "hourly" || payType === "daily") && (
            <>
              <div className="flex items-center gap-2">
                <label className="font-pixel text-sm whitespace-nowrap">🎌 休日{payType === "daily" ? "日給" : "時給"}+</label>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={holiday}
                    onChange={(e) => setHoliday(e.target.value)}
                    className="tabular h-10 pl-7 text-right font-bold"
                  />
                </div>
              </div>
              <p className="font-pixel -mt-1 text-[10px] text-white/50">土日・祝日はこの分だけ上がる</p>
            </>
          )}

          {/* 時間帯割増ルール：時給のみ */}
          {payType === "hourly" && (
          <>
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
          </>
          )}

          <div className="flex gap-2">
            <DQCommand label={editingId ? "ほぞんする" : "ついかする"} active accent="gold" onClick={submitForm} />
            {workplaces.length > 0 && <DQCommand label="やめる" se="cancel" onClick={resetForm} />}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setAdding(true);
          }}
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
