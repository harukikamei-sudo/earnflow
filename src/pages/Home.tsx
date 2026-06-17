import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Moon,
  Play,
  RotateCcw,
  Square,
  Target,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSalaryEngine } from "@/hooks/useSalaryEngine";
import { multiplierAt, sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { getGoal, getSessions, getWorkplaces, upsertWorkplace } from "@/lib/store";
import type { Workplace } from "@/lib/types";
import { levelInfo, rankForLevel } from "@/lib/rpg";
import { cn, formatDuration, formatYen, formatYenPrecise } from "@/lib/utils";

/** クイック入力で作る既定バイト先の固定 ID（毎回これを upsert して使い回す） */
const QUICK_ID = "earnflow.quick";

interface FloatingCoin {
  id: number;
  amount: number;
}

/**
 * 給料カウンター（ホーム）— RPG 風リアルタイム収入トラッカー。
 *
 * 稼いだ円を「ゴールド」、累計を「経験値」とみなし、しきい値でレベルアップする。
 * 時間帯別の割増は「バフ」として表示する。
 */
export default function Home() {
  const engine = useSalaryEngine();
  const { status, sessionEarnings, totalGold, elapsedSec } = engine;

  // バイト先（Presets で作ったものがあれば選択可能。無ければクイック入力を使う）
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() => getWorkplaces());
  const [selectedId, setSelectedId] = useState<string>(
    () => getWorkplaces().find((w) => w.id !== QUICK_ID)?.id ?? "",
  );
  const [hourlyInput, setHourlyInput] = useState<string>("1100");
  const [nightBonus, setNightBonus] = useState<boolean>(true);

  // 計測対象のバイト先を決める（選択中の既存先 or クイック入力のプレビュー）
  const activeWorkplace = useMemo<Workplace | null>(() => {
    if (status === "running" && engine.runningWorkplace) {
      return engine.runningWorkplace;
    }
    const selected = workplaces.find((w) => w.id === selectedId && w.id !== QUICK_ID);
    if (selected) return selected;
    const rate = Number(hourlyInput);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return buildQuickWorkplace(rate, nightBonus);
  }, [status, engine.runningWorkplace, workplaces, selectedId, hourlyInput, nightBonus]);

  // 現在適用中の割増倍率（バフ表示用）
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const multiplier = activeWorkplace
    ? multiplierAt(new Date(nowTs), activeWorkplace.timeRules)
    : 1;

  // 1 秒あたりの収入（表示用）
  const perSecond =
    activeWorkplace && activeWorkplace.payType === "hourly"
      ? (activeWorkplace.hourlyRate / 3600) * multiplier
      : 0;

  const level = useMemo(() => levelInfo(totalGold), [totalGold]);
  const rank = rankForLevel(level.level);

  /* ---- 浮かび上がるコイン演出（整数桁が増えるたびに発生） ---- */
  const [coins, setCoins] = useState<FloatingCoin[]>([]);
  const lastIntRef = useRef<number>(0);
  const coinIdRef = useRef<number>(0);
  useEffect(() => {
    if (status !== "running") {
      lastIntRef.current = Math.floor(sessionEarnings);
      return;
    }
    const cur = Math.floor(sessionEarnings);
    const delta = cur - lastIntRef.current;
    if (delta > 0) {
      lastIntRef.current = cur;
      const id = ++coinIdRef.current;
      setCoins((prev) => [...prev.slice(-6), { id, amount: delta }]);
      window.setTimeout(() => {
        setCoins((prev) => prev.filter((c) => c.id !== id));
      }, 1000);
    }
  }, [sessionEarnings, status]);

  /* ---- レベルアップ演出 ---- */
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const prevLevelRef = useRef<number>(level.level);
  useEffect(() => {
    if (level.level > prevLevelRef.current && status === "running") {
      setLevelUp(level.level);
      window.setTimeout(() => setLevelUp(null), 1800);
    }
    prevLevelRef.current = level.level;
  }, [level.level, status]);

  /* ---- 月目標トラッカー ---- */
  // status を依存に入れ、開始/停止のたびに store から読み直す（停止で確定保存された分を取り込む）
  const monthlyTarget = useMemo(() => getGoal().monthlyTarget, []);
  const monthBase = useMemo(() => {
    const now = new Date();
    return sumEarnings(sessionsInMonth(getSessions(), now.getFullYear(), now.getMonth()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const monthEarned = monthBase + (status === "running" ? sessionEarnings : 0);
  const monthProgress = monthlyTarget > 0 ? Math.min(1, monthEarned / monthlyTarget) : 0;

  /* ---- 操作 ---- */
  const canStart = !!activeWorkplace;

  function handleStart() {
    if (!activeWorkplace) return;
    const wp = activeWorkplace;
    // クイック入力のバイト先は localStorage に確定保存（リロード復帰のため）
    if (wp.id === QUICK_ID) {
      const list = upsertWorkplace(wp);
      setWorkplaces(list);
    }
    lastIntRef.current = 0;
    prevLevelRef.current = levelInfo(totalGold).level;
    engine.start(wp);
  }

  const statusLabel =
    status === "running" ? "稼働中" : status === "stopped" ? "確定" : "待機中";

  return (
    <div className="flex flex-col gap-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/30">
          <Coins className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">給料クエスト</h1>
          <p className="text-sm text-muted-foreground">今いくら稼いでる？</p>
        </div>
      </div>

      {/* メインカウンター */}
      <Card className="gold-glow relative overflow-hidden">
        {/* レベルアップ演出 */}
        {levelUp !== null && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <div className="absolute h-40 w-40 rounded-full border-2 border-gold/60 animate-ring-burst" />
            <div className="animate-level-pop text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-gold">
                LEVEL UP!
              </p>
              <p className="text-4xl font-black text-gold-gradient">Lv.{levelUp}</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {rank.emoji} {rank.name}
              </p>
            </div>
          </div>
        )}

        <CardContent className="relative flex flex-col items-center gap-1 py-8 text-center">
          {/* 浮かぶコイン */}
          <div className="pointer-events-none absolute left-1/2 top-16">
            {coins.map((c) => (
              <span
                key={c.id}
                className="absolute left-0 top-0 -translate-x-1/2 animate-coin-float whitespace-nowrap text-sm font-black text-gold-light drop-shadow"
              >
                +{formatYen(c.amount)}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                status === "running"
                  ? "bg-gold/15 text-gold animate-pulse-gold"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "running" ? "bg-gold" : "bg-muted-foreground",
                )}
              />
              {statusLabel}
            </span>
            {activeWorkplace && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {activeWorkplace.name}
              </span>
            )}
          </div>

          <p className="tabular text-6xl font-black leading-none text-gold-gradient">
            ¥{formatYenPrecise(sessionEarnings, status === "running" ? 2 : 0)}
          </p>

          <p className="tabular mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDuration(elapsedSec)}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-gold" />
              {perSecond > 0 ? `¥${perSecond.toFixed(2)}/秒` : "—"}
            </span>
          </p>

          {/* バフ（時間帯割増） */}
          {multiplier > 1 && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold ring-1 ring-gold/30">
              <Moon className="h-3.5 w-3.5" />
              割増バフ ×{multiplier} 発動中！
            </span>
          )}
        </CardContent>
      </Card>

      {/* レベル & 経験値バー */}
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{rank.emoji}</span>
              <div className="leading-tight">
                <p className="text-sm font-black">{rank.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  累計 {formatYen(totalGold)} 稼いだ
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Level
              </p>
              <p className="text-2xl font-black text-gold-gradient leading-none">
                {level.level}
              </p>
            </div>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-300"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
          <p className="text-right text-[11px] text-muted-foreground">
            次のレベルまで あと {formatYen(level.remaining)}
          </p>
        </CardContent>
      </Card>

      {/* 操作ボタン */}
      <div className="grid grid-cols-3 gap-3">
        {status === "running" ? (
          <Button
            size="lg"
            variant="destructive"
            className="col-span-2"
            onClick={engine.stop}
          >
            <Square className="fill-current" />
            ストップ
          </Button>
        ) : (
          <Button
            size="lg"
            className="col-span-2"
            disabled={!canStart}
            onClick={handleStart}
          >
            <Play className="fill-current" />
            {status === "stopped" ? "もう一度スタート" : "スタート"}
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          disabled={status === "idle"}
          onClick={engine.reset}
        >
          <RotateCcw />
        </Button>
      </div>

      {/* 設定（待機中のみ）：既存バイト先の選択 or 時給クイック入力 */}
      {status !== "running" && (
        <Card>
          <CardContent className="flex flex-col gap-4 py-4">
            {workplaces.filter((w) => w.id !== QUICK_ID).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {workplaces
                  .filter((w) => w.id !== QUICK_ID)
                  .map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedId(w.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                        selectedId === w.id
                          ? "bg-gold text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                      )}
                    >
                      {w.name}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => setSelectedId("")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    selectedId === ""
                      ? "bg-gold text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  時給を直接入力
                </button>
              </div>
            )}

            {selectedId === "" && (
              <>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-foreground">時給</label>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ¥
                    </span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={hourlyInput}
                      onChange={(e) => setHourlyInput(e.target.value)}
                      className="pl-8 text-right font-bold tabular"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      /時
                    </span>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Moon className="h-4 w-4 text-gold" />
                    深夜割増（22時〜5時 ×1.25）
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={nightBonus}
                    onClick={() => setNightBonus((v) => !v)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      nightBonus ? "bg-gold" : "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
                        nightBonus ? "translate-x-[22px]" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </label>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 月目標トラッカー */}
      {monthlyTarget > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Target className="h-4 w-4 text-gold" />
                今月の目標
              </span>
              <span className="tabular text-sm font-bold">
                {formatYen(monthEarned)} / {formatYen(monthlyTarget)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-300"
                style={{ width: `${Math.round(monthProgress * 100)}%` }}
              />
            </div>
            <p className="text-right text-[11px] text-muted-foreground">
              {monthEarned >= monthlyTarget
                ? "🎉 目標達成！"
                : `あと ${formatYen(monthlyTarget - monthEarned)}`}
            </p>
          </CardContent>
        </Card>
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
