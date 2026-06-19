/**
 * 給料カウンターのエンジン（時間管理 + 収入計算 + 永続化）。
 *
 * - status: idle（待機） / running（計測中） / stopped（停止＝確定済み）
 * - 計測中は約 100ms ごとに現在時刻を更新し、currentEarnings() でリアルタイム収入を算出。
 * - 計測中の「アクティブセッション」を localStorage に保持し、リロードしても復帰できる。
 * - 停止時に finalizeSession() で確定し、store.addSession() で履歴に保存する。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Workplace } from "@/lib/types";
import { currentEarnings, finalizeSession, sumEarnings } from "@/lib/earnings";
import { addSession, getSessions, getWorkplaces } from "@/lib/store";
import { getEarningBoost } from "@/game/playerStore";
import { usePageVisible } from "@/hooks/usePageVisible";

export type EngineStatus = "idle" | "running" | "stopped";

const ACTIVE_KEY = "earnflow.activeSession";

interface ActiveSession {
  workplaceId: string;
  startMs: number;
}

function readActive(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSession) : null;
  } catch {
    return null;
  }
}

function writeActive(active: ActiveSession | null): void {
  try {
    if (active) localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* private mode 等は無視 */
  }
}

export interface SalaryEngine {
  status: EngineStatus;
  /** 計測中の経過秒数 */
  elapsedSec: number;
  /** 現在セッションの収入（小数を含む生の値） */
  sessionEarnings: number;
  /** これまでの累計ゴールド（保存済み履歴 + 現在セッションのライブ分） */
  totalGold: number;
  /** 計測中に適用中のバイト先（なければ null） */
  runningWorkplace: Workplace | null;
  start: (wp: Workplace) => void;
  stop: () => void;
  reset: () => void;
  /** 保存済みセッションから累計ゴールドを再計算する（手入力で収入を追加した時など） */
  refreshLifetime: () => void;
}

export function useSalaryEngine(): SalaryEngine {
  // マウント時に「計測中だったセッション」を一度だけ解決して初期値に使う（リロード復帰）
  const [bootstrap] = useState<{ wp: Workplace; startMs: number } | null>(() => {
    const active = readActive();
    if (!active) return null;
    const wp = getWorkplaces().find((w) => w.id === active.workplaceId);
    return wp ? { wp, startMs: active.startMs } : null;
  });

  const [status, setStatus] = useState<EngineStatus>(bootstrap ? "running" : "idle");
  const [startMs, setStartMs] = useState<number>(bootstrap?.startMs ?? 0);
  const [now, setNow] = useState<number>(() => Date.now());
  const [runningWorkplace, setRunningWorkplace] = useState<Workplace | null>(
    bootstrap?.wp ?? null,
  );
  /** 保存済み履歴の合計（レベル計算のベース） */
  const [lifetimeGold, setLifetimeGold] = useState<number>(() =>
    sumEarnings(getSessions()),
  );
  /** 停止後に表示し続ける確定収入 */
  const [stoppedEarnings, setStoppedEarnings] = useState<number>(0);

  const tickRef = useRef<number | null>(null);
  const visible = usePageVisible();

  // 参照先のバイト先が消えている等で復帰できなかった場合、古いアクティブ情報を掃除する
  useEffect(() => {
    const active = readActive();
    if (active && !getWorkplaces().some((w) => w.id === active.workplaceId)) {
      writeActive(null);
    }
  }, []);

  // 計測中だけ時刻を更新するタイマー。
  // バックグラウンド（非表示）では止めて電池を節約する。収入はタイムスタンプから
  // 計算するので、再表示時に setNow で一括して正しい値に復帰する。
  useEffect(() => {
    if (status !== "running" || !visible) return;
    setNow(Date.now()); // 再表示時に即追いつく
    const id = window.setInterval(() => setNow(Date.now()), 100);
    tickRef.current = id;
    return () => {
      window.clearInterval(id);
      tickRef.current = null;
    };
  }, [status, visible]);

  const sessionEarnings =
    status === "stopped"
      ? stoppedEarnings
      : status === "running" && runningWorkplace
        ? currentEarnings(runningWorkplace, startMs, now) * getEarningBoost()
        : 0;

  const elapsedSec =
    status === "running"
      ? Math.max(0, Math.floor((now - startMs) / 1000))
      : 0;

  const totalGold = lifetimeGold + sessionEarnings;

  const start = useCallback((wp: Workplace) => {
    const t = Date.now();
    setRunningWorkplace(wp);
    setStartMs(t);
    setNow(t);
    setStoppedEarnings(0);
    setStatus("running");
    writeActive({ workplaceId: wp.id, startMs: t });
  }, []);

  const stop = useCallback(() => {
    if (status !== "running" || !runningWorkplace) return;
    const endMs = Date.now();
    const base = finalizeSession(runningWorkplace, startMs, endMs);
    const session = { ...base, earnings: Math.round(base.earnings * getEarningBoost()) };
    if (session.durationSec > 0 && session.earnings > 0) {
      addSession(session);
      setLifetimeGold((g) => g + session.earnings);
      setStoppedEarnings(session.earnings);
    } else {
      setStoppedEarnings(0);
    }
    setStatus("stopped");
    writeActive(null);
  }, [status, runningWorkplace, startMs]);

  const reset = useCallback(() => {
    setStatus("idle");
    setStoppedEarnings(0);
    setStartMs(0);
    writeActive(null);
  }, []);

  const refreshLifetime = useCallback(() => {
    setLifetimeGold(sumEarnings(getSessions()));
  }, []);

  return {
    status,
    elapsedSec,
    sessionEarnings,
    totalGold,
    runningWorkplace,
    start,
    stop,
    reset,
    refreshLifetime,
  };
}
