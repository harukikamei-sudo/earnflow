import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Stage, type StageCoin } from "@/components/pixel/Stage";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { useSalaryEngine } from "@/hooks/useSalaryEngine";
import { multiplierAt, sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { getGoal, getSessions, getWorkplaces, upsertWorkplace } from "@/lib/store";
import type { Workplace } from "@/lib/types";
import { levelInfo, rankForLevel } from "@/lib/rpg";
import { cn, formatDuration, formatYen, formatYenPrecise } from "@/lib/utils";

/** クイック入力で作る既定バイト先の固定 ID（毎回これを upsert して使い回す） */
const QUICK_ID = "earnflow.quick";

/**
 * 給料クエスト（ホーム）— ドラクエ風に勇者が道を進む RPG 仕立ての収入トラッカー。
 *
 * 「はたらく」で計測開始＝勇者が道を歩き出し、稼いだ円をゴールド／経験値として
 * 累積する。しきい値でレベルアップ（道中でメッセージウィンドウ）。
 */
export default function Home() {
  const engine = useSalaryEngine();
  const { status, sessionEarnings, totalGold, elapsedSec } = engine;
  const running = status === "running";

  // バイト先（Presets で作ったものがあれば選択可能。無ければ時給クイック入力）
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() => getWorkplaces());
  const [selectedId, setSelectedId] = useState<string>(
    () => getWorkplaces().find((w) => w.id !== QUICK_ID)?.id ?? "",
  );
  const [hourlyInput, setHourlyInput] = useState<string>("1100");
  const [nightBonus, setNightBonus] = useState<boolean>(true);

  // 計測対象のバイト先（計測中は固定、待機中は選択 or クイック入力プレビュー）
  const activeWorkplace = useMemo<Workplace | null>(() => {
    if (running && engine.runningWorkplace) return engine.runningWorkplace;
    const selected = workplaces.find((w) => w.id === selectedId && w.id !== QUICK_ID);
    if (selected) return selected;
    const rate = Number(hourlyInput);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return buildQuickWorkplace(rate, nightBonus);
  }, [running, engine.runningWorkplace, workplaces, selectedId, hourlyInput, nightBonus]);

  // 1秒ごとの時刻更新（時間帯・バフ表示用）
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const multiplier = activeWorkplace
    ? multiplierAt(new Date(nowTs), activeWorkplace.timeRules)
    : 1;
  const perSecond =
    activeWorkplace && activeWorkplace.payType === "hourly"
      ? (activeWorkplace.hourlyRate / 3600) * multiplier
      : 0;

  const level = useMemo(() => levelInfo(totalGold), [totalGold]);
  const rank = rankForLevel(level.level);

  /* ---- 拾うコイン演出（整数桁が増えるたびに発生） ---- */
  const [coins, setCoins] = useState<StageCoin[]>([]);
  const lastIntRef = useRef<number>(0);
  const coinIdRef = useRef<number>(0);
  useEffect(() => {
    if (!running) {
      lastIntRef.current = Math.floor(sessionEarnings);
      return;
    }
    const cur = Math.floor(sessionEarnings);
    const delta = cur - lastIntRef.current;
    if (delta > 0) {
      lastIntRef.current = cur;
      const id = ++coinIdRef.current;
      setCoins((prev) => [...prev.slice(-5), { id, amount: delta }]);
      window.setTimeout(() => {
        setCoins((prev) => prev.filter((c) => c.id !== id));
      }, 1000);
    }
  }, [sessionEarnings, running]);

  /* ---- レベルアップ演出 ---- */
  const [levelUp, setLevelUp] = useState<{ level: number; rank: string } | null>(null);
  const prevLevelRef = useRef<number>(level.level);
  useEffect(() => {
    if (level.level > prevLevelRef.current && running) {
      setLevelUp({ level: level.level, rank: rankForLevel(level.level).name });
      window.setTimeout(() => setLevelUp(null), 2600);
    }
    prevLevelRef.current = level.level;
  }, [level.level, running]);

  /* ---- 月目標トラッカー ---- */
  const monthlyTarget = useMemo(() => getGoal().monthlyTarget, []);
  const monthBase = useMemo(() => {
    const now = new Date();
    return sumEarnings(sessionsInMonth(getSessions(), now.getFullYear(), now.getMonth()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const monthEarned = monthBase + (running ? sessionEarnings : 0);
  const monthProgress = monthlyTarget > 0 ? Math.min(1, monthEarned / monthlyTarget) : 0;

  /* ---- 操作 ---- */
  const canStart = !!activeWorkplace;

  function handleStart() {
    if (!activeWorkplace) return;
    const wp = activeWorkplace;
    if (wp.id === QUICK_ID) {
      const list = upsertWorkplace(wp);
      setWorkplaces(list);
    }
    lastIntRef.current = 0;
    prevLevelRef.current = levelInfo(totalGold).level;
    engine.start(wp);
  }

  const realWorkplaces = workplaces.filter((w) => w.id !== QUICK_ID);

  return (
    <div className="flex flex-col gap-4">
      {/* タイトル */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-pixel text-lg font-bold tracking-wide text-gold-gradient">
          給料クエスト
        </h1>
        <span className="font-pixel text-[11px] text-muted-foreground">
          今いくら稼いでる？
        </span>
      </div>

      {/* 旅ステージ（勇者が道を進む） */}
      <Stage
        walking={running}
        level={level.level}
        nowTs={nowTs}
        coins={coins}
        buffed={multiplier > 1}
      />

      {/* しょとく / レベル */}
      <DQWindow title="しょとく">
        <div className="text-center">
          <p className="font-pixel text-4xl font-bold leading-none text-gold-gradient">
            ¥{formatYenPrecise(sessionEarnings, running ? 2 : 0)}
          </p>
          <p className="font-pixel mt-1 text-xs text-white/70">
            {formatYen(totalGold, false)} G ためた
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between font-pixel text-sm">
            <span>
              {rank.emoji} {rank.name}
            </span>
            <span className="text-gold">Lv.{level.level}</span>
          </div>
          {/* 経験値バー（ドラクエ風） */}
          <div className="relative h-3 w-full overflow-hidden rounded-sm bg-black ring-1 ring-white/40">
            <div
              className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-300"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
          <p className="font-pixel text-right text-[11px] text-white/60">
            つぎのレベルまで あと {formatYen(level.remaining)}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3 font-pixel text-[11px] text-white/70">
          <span className="tabular">{formatDuration(elapsedSec)}</span>
          <span className="text-white/30">／</span>
          <span>{perSecond > 0 ? `¥${perSecond.toFixed(2)}/秒` : "—"}</span>
          {multiplier > 1 && (
            <span className="rounded bg-gold/20 px-1.5 py-0.5 font-bold text-gold">
              🌙 ×{multiplier} バフ
            </span>
          )}
        </div>
      </DQWindow>

      {/* コマンド */}
      <DQWindow title="コマンド">
        {running ? (
          <DQCommand label="しごとを やめる" active accent="red" onClick={engine.stop} />
        ) : (
          <DQCommand
            label={status === "stopped" ? "また はたらく" : "はたらく"}
            active
            accent="gold"
            disabled={!canStart}
            onClick={handleStart}
          />
        )}
        <DQCommand
          label="さいしょから"
          disabled={status === "idle"}
          onClick={engine.reset}
        />
      </DQWindow>

      {/* せってい（待機中のみ） */}
      {!running && (
        <DQWindow title="せってい">
          {realWorkplaces.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {realWorkplaces.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedId(w.id)}
                  className={cn(
                    "font-pixel rounded px-3 py-1 text-xs transition-colors",
                    selectedId === w.id
                      ? "bg-gold text-black"
                      : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {w.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedId("")}
                className={cn(
                  "font-pixel rounded px-3 py-1 text-xs transition-colors",
                  selectedId === ""
                    ? "bg-gold text-black"
                    : "bg-white/10 text-white hover:bg-white/20",
                )}
              >
                時給を入力
              </button>
            </div>
          )}

          {selectedId === "" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="font-pixel text-sm">時給</label>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={hourlyInput}
                    onChange={(e) => setHourlyInput(e.target.value)}
                    className="tabular pl-7 text-right font-bold"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    /時
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between">
                <span className="font-pixel text-sm">🌙 深夜割増（22時〜5時 ×1.25）</span>
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
            </div>
          )}
        </DQWindow>
      )}

      {/* 月目標 */}
      {monthlyTarget > 0 && (
        <DQWindow title="こんげつの もくひょう">
          <div className="flex items-center justify-between font-pixel text-sm">
            <span>🎯 もくひょう</span>
            <span className="tabular">
              {formatYen(monthEarned)} / {formatYen(monthlyTarget)}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-sm bg-black ring-1 ring-white/40">
            <div
              className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-300"
              style={{ width: `${Math.round(monthProgress * 100)}%` }}
            />
          </div>
          <p className="font-pixel mt-1 text-right text-[11px] text-white/60">
            {monthEarned >= monthlyTarget
              ? "🎉 もくひょう たっせい！"
              : `あと ${formatYen(monthlyTarget - monthEarned)}`}
          </p>
        </DQWindow>
      )}

      {/* レベルアップ メッセージ（ドラクエ風） */}
      {levelUp && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center px-6">
          <DQWindow className="anim-dq-pop w-full max-w-xs text-center">
            <p className="font-pixel text-sm leading-relaxed text-white">
              ＊「ゆうしゃ」は
              <br />
              レベル <span className="text-gold">{levelUp.level}</span> に あがった！
            </p>
            <p className="font-pixel mt-2 text-sm text-gold">
              {`「${levelUp.rank}」になった！`}
            </p>
          </DQWindow>
        </div>
      )}
    </div>
  );
}

/** クイック入力から既定バイト先オブジェクトを組み立てる */
function buildQuickWorkplace(hourlyRate: number, nightBonus: boolean): Workplace {
  return {
    id: QUICK_ID,
    name: "マイバイト",
    payType: "hourly",
    hourlyRate,
    dailyRate: 0,
    timeRules: nightBonus
      ? [
          {
            id: "quick-night",
            label: "深夜割増",
            startHour: 22,
            endHour: 5,
            multiplier: 1.25,
          },
        ]
      : [],
    createdAt: Date.now(),
  };
}
