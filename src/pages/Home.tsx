import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Stage, type StageCoin } from "@/components/pixel/Stage";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { Overworld } from "@/components/game/Overworld";
import { TouchControls } from "@/components/game/TouchControls";
import { useOverworld } from "@/game/useOverworld";
import { useSalaryEngine } from "@/hooks/useSalaryEngine";
import { multiplierAt } from "@/lib/earnings";
import { upsertWorkplace } from "@/lib/store";
import type { Workplace } from "@/lib/types";
import { levelInfo, rankForLevel } from "@/lib/rpg";
import { cn, formatDuration, formatYen, formatYenPrecise } from "@/lib/utils";

const QUICK_ID = "earnflow.quick";

type Scene = "roam" | "work";
type Dialog = "work-prompt" | "sign" | null;

/**
 * 給料クエスト（ホーム）— ドラクエ風トップダウンRPG。
 *
 * 草原を自由に歩き、バイト先（¥バイトの建物）で「けってい」すると労働モードへ。
 * 労働中は横スクロールの仕事シーンで収入＝ゴールド＝経験値が増えていく。
 */
export default function Home() {
  const engine = useSalaryEngine();
  const { sessionEarnings, totalGold, elapsedSec } = engine;

  const [scene, setScene] = useState<Scene>("roam");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [hourlyInput, setHourlyInput] = useState("1100");
  const [nightBonus, setNightBonus] = useState(true);

  const overworld = useOverworld({
    enabled: scene === "roam" && dialog === null,
    onInteract: (r) => {
      if (r.type === "work") setDialog("work-prompt");
      else if (r.type === "sign") setDialog("sign");
    },
  });

  // 時刻（時間帯・バフ用）
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const working = scene === "work";
  const previewWp = useMemo(() => {
    const rate = Number(hourlyInput);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return buildQuickWorkplace(rate, nightBonus);
  }, [hourlyInput, nightBonus]);

  const activeWp = working ? engine.runningWorkplace : previewWp;
  const multiplier = activeWp ? multiplierAt(new Date(nowTs), activeWp.timeRules) : 1;
  const perSecond =
    activeWp && activeWp.payType === "hourly"
      ? (activeWp.hourlyRate / 3600) * multiplier
      : 0;

  const level = useMemo(() => levelInfo(totalGold), [totalGold]);
  const rank = rankForLevel(level.level);

  /* ---- コイン演出 ---- */
  const [coins, setCoins] = useState<StageCoin[]>([]);
  const lastIntRef = useRef(0);
  const coinIdRef = useRef(0);
  useEffect(() => {
    if (!working) {
      lastIntRef.current = Math.floor(sessionEarnings);
      return;
    }
    const cur = Math.floor(sessionEarnings);
    const delta = cur - lastIntRef.current;
    if (delta > 0) {
      lastIntRef.current = cur;
      const id = ++coinIdRef.current;
      setCoins((prev) => [...prev.slice(-5), { id, amount: delta }]);
      window.setTimeout(() => setCoins((prev) => prev.filter((c) => c.id !== id)), 1000);
    }
  }, [sessionEarnings, working]);

  /* ---- レベルアップ演出 ---- */
  const [levelUp, setLevelUp] = useState<{ level: number; rank: string } | null>(null);
  const prevLevelRef = useRef(level.level);
  useEffect(() => {
    if (level.level > prevLevelRef.current && working) {
      setLevelUp({ level: level.level, rank: rankForLevel(level.level).name });
      window.setTimeout(() => setLevelUp(null), 2600);
    }
    prevLevelRef.current = level.level;
  }, [level.level, working]);

  /* ---- 操作 ---- */
  function startWork() {
    if (!previewWp) return;
    upsertWorkplace(previewWp);
    lastIntRef.current = 0;
    prevLevelRef.current = levelInfo(totalGold).level;
    engine.start(previewWp);
    setScene("work");
    setDialog(null);
  }
  function stopWork() {
    engine.stop();
    engine.reset();
    setScene("roam");
  }

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-[#0a0c1c]">
      {working ? (
        /* ============ 労働シーン ============ */
        <div className="no-scrollbar mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto px-4 py-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">はたらいています</h1>
            <span className="font-pixel text-[11px] text-white/60">{activeWp?.name}</span>
          </div>

          <Stage walking level={level.level} nowTs={nowTs} coins={coins} buffed={multiplier > 1} />

          <DQWindow title="しょとく">
            <div className="text-center">
              <p className="font-pixel text-4xl font-bold leading-none text-gold-gradient">
                ¥{formatYenPrecise(sessionEarnings, 2)}
              </p>
              <p className="font-pixel mt-1 text-xs text-white/70">
                {formatYen(totalGold, false)} G ためた
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between font-pixel text-sm">
                <span>{rank.emoji} {rank.name}</span>
                <span className="text-gold">Lv.{level.level}</span>
              </div>
              <ExpBar progress={level.progress} />
              <p className="font-pixel text-right text-[11px] text-white/60">
                つぎのレベルまで あと {formatYen(level.remaining)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 font-pixel text-[11px] text-white/70">
              <span className="tabular">{formatDuration(elapsedSec)}</span>
              <span className="text-white/30">／</span>
              <span>{perSecond > 0 ? `¥${perSecond.toFixed(2)}/秒` : "—"}</span>
              {multiplier > 1 && (
                <span className="rounded bg-gold/20 px-1.5 py-0.5 font-bold text-gold">🌙 ×{multiplier}</span>
              )}
            </div>
          </DQWindow>

          <DQWindow title="コマンド">
            <DQCommand label="しごとを やめて まちに もどる" active accent="red" onClick={stopWork} />
          </DQWindow>
        </div>
      ) : (
        /* ============ 町（トップダウン） ============ */
        <>
          <Overworld snap={overworld.snap} className="absolute inset-0" />

          {/* 上部HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
            <div className="dq-window pointer-events-auto px-3 py-1.5">
              <div className="flex items-center gap-3 font-pixel text-xs">
                <span className="text-gold">Lv.{level.level}</span>
                <span>{formatYen(totalGold, false)} G</span>
              </div>
              <div className="mt-1 w-28">
                <ExpBar progress={level.progress} thin />
              </div>
            </div>
            <div className="pointer-events-auto flex gap-1">
              <Link to="/calendar" className="dq-window grid h-9 w-9 place-items-center text-sm" aria-label="カレンダー">
                📅
              </Link>
              <Link to="/presets" className="dq-window grid h-9 w-9 place-items-center text-sm" aria-label="バイト先">
                ⚙️
              </Link>
            </div>
          </div>

          <TouchControls
            onPress={overworld.press}
            onRelease={overworld.release}
            onAction={overworld.interact}
            actionLabel="しらべる"
          />

          {/* ヒント */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2">
            <p className="font-pixel rounded bg-black/55 px-3 py-1 text-[11px] text-white/80">
              十字キーで移動・「¥バイト」で しらべる
            </p>
          </div>
        </>
      )}

      {/* ====== ダイアログ ====== */}
      {dialog === "sign" && (
        <DialogOverlay onClose={() => setDialog(null)}>
          <DQWindow title="たてふだ" className="anim-dq-pop w-full max-w-xs">
            <p className="font-pixel text-sm leading-relaxed text-white">
              やあ ぼうけんしゃ！
              <br />
              十字キーで あるいて
              <br />
              みせ（¥バイト）で「しらべる」と
              <br />
              はたらいて お金を かせげるぞ！
            </p>
            <div className="mt-2">
              <DQCommand label="とじる" active onClick={() => setDialog(null)} />
            </div>
          </DQWindow>
        </DialogOverlay>
      )}

      {dialog === "work-prompt" && (
        <DialogOverlay onClose={() => setDialog(null)}>
          <DQWindow title="¥バイト" className="anim-dq-pop w-full max-w-xs">
            <p className="font-pixel mb-3 text-sm text-white">ここで はたらきますか？</p>

            <div className="mb-2 flex items-center gap-2">
              <label className="font-pixel text-sm">時給</label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={hourlyInput}
                  onChange={(e) => setHourlyInput(e.target.value)}
                  className="tabular h-10 pl-7 text-right font-bold"
                />
              </div>
            </div>

            <label className="mb-3 flex cursor-pointer items-center justify-between">
              <span className="font-pixel text-xs">🌙 深夜割増 ×1.25</span>
              <button
                type="button"
                role="switch"
                aria-checked={nightBonus}
                onClick={() => setNightBonus((v) => !v)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  nightBonus ? "bg-gold" : "bg-white/20",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    nightBonus ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>

            <DQCommand label="はたらく！" active accent="gold" disabled={!previewWp} onClick={startWork} />
            <DQCommand label="やめておく" onClick={() => setDialog(null)} />
          </DQWindow>
        </DialogOverlay>
      )}

      {/* レベルアップ メッセージ */}
      {levelUp && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center px-6">
          <DQWindow className="anim-dq-pop w-full max-w-xs text-center">
            <p className="font-pixel text-sm leading-relaxed text-white">
              ＊「ゆうしゃ」は
              <br />
              レベル <span className="text-gold">{levelUp.level}</span> に あがった！
            </p>
            <p className="font-pixel mt-2 text-sm text-gold">{`「${levelUp.rank}」になった！`}</p>
          </DQWindow>
        </div>
      )}
    </div>
  );
}

/** 経験値バー（ドラクエ風） */
function ExpBar({ progress, thin }: { progress: number; thin?: boolean }) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-sm bg-black ring-1 ring-white/40",
        thin ? "h-2" : "h-3",
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-300"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}

/** 中央モーダルの薄暗い背景 */
function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-black/55 px-6"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/** クイック入力から既定バイト先を組み立てる */
function buildQuickWorkplace(hourlyRate: number, nightBonus: boolean): Workplace {
  return {
    id: QUICK_ID,
    name: "マイバイト",
    payType: "hourly",
    hourlyRate,
    dailyRate: 0,
    timeRules: nightBonus
      ? [{ id: "quick-night", label: "深夜割増", startHour: 22, endHour: 5, multiplier: 1.25 }]
      : [],
    createdAt: Date.now(),
  };
}
