/**
 * トップダウン移動エンジン。
 *
 * ドラクエ風に1マスずつ歩く（押している間は連続歩行）。キーボード（矢印/WASD）と
 * タッチ操作（press/release）の両対応。タイルの通行判定と歩行アニメを扱う。
 * 「調べる」操作は持たず、バイト先への接近判定は呼び出し側が snap の座標で行う。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroDir } from "@/components/pixel/sprites";
import { SPAWN } from "./map";
import { isWalkable } from "./mapStore";

const STEP_MS = 170;
type XY = { x: number; y: number };
const VEC: Record<HeroDir, XY> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface OverworldSnap {
  /** 表示用のタイル座標（移動中は小数） */
  px: number;
  py: number;
  dir: HeroDir;
  /** 歩行アニメのコマ（0 or 1） */
  frame: number;
  moving: boolean;
}

export interface Overworld {
  snap: OverworldSnap;
  press: (dir: HeroDir) => void;
  release: (dir: HeroDir) => void;
}

export function useOverworld(opts: { enabled: boolean; resetKey?: string | number }): Overworld {
  const enabledRef = useRef(opts.enabled);
  useEffect(() => {
    enabledRef.current = opts.enabled;
  });

  const game = useRef<{
    cur: XY;
    from: XY;
    to: XY;
    stepStart: number;
    moving: boolean;
    dir: HeroDir;
    toggle: number;
    pressed: HeroDir[];
    pendingReset: boolean;
  }>({
    cur: { x: SPAWN.x, y: SPAWN.y },
    from: { x: SPAWN.x, y: SPAWN.y },
    to: { x: SPAWN.x, y: SPAWN.y },
    stepStart: 0,
    moving: false,
    dir: "up",
    toggle: 0,
    pressed: [],
    pendingReset: false,
  });

  // ステージが切り替わったら次フレームで初期位置に戻す（setStateはloop内で行う）
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    game.current.pendingReset = true;
  }, [opts.resetKey]);

  const [snap, setSnap] = useState<OverworldSnap>({
    px: SPAWN.x,
    py: SPAWN.y,
    dir: "up",
    frame: 0,
    moving: false,
  });
  const lastSnap = useRef(snap);

  const press = useCallback((dir: HeroDir) => {
    const g = game.current;
    if (!g.pressed.includes(dir)) g.pressed.push(dir);
  }, []);
  const release = useCallback((dir: HeroDir) => {
    const g = game.current;
    g.pressed = g.pressed.filter((d) => d !== dir);
  }, []);

  // メインループ
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const g = game.current;
      if (g.pendingReset) {
        g.cur = { x: SPAWN.x, y: SPAWN.y };
        g.from = { ...g.cur };
        g.to = { ...g.cur };
        g.moving = false;
        g.pressed = [];
        g.dir = "up";
        g.pendingReset = false;
      }
      let px = g.cur.x;
      let py = g.cur.y;
      let frame = 0;

      if (g.moving) {
        const p = Math.min(1, (t - g.stepStart) / STEP_MS);
        px = g.from.x + (g.to.x - g.from.x) * p;
        py = g.from.y + (g.to.y - g.from.y) * p;
        const base = g.toggle % 2;
        frame = p < 0.5 ? base : 1 - base;
        if (p >= 1) {
          g.cur = { ...g.to };
          g.moving = false;
          px = g.cur.x;
          py = g.cur.y;
        }
      }

      if (!g.moving && enabledRef.current && g.pressed.length > 0) {
        const dir = g.pressed[g.pressed.length - 1];
        g.dir = dir;
        const v = VEC[dir];
        const nx = g.cur.x + v.x;
        const ny = g.cur.y + v.y;
        if (isWalkable(nx, ny)) {
          g.from = { ...g.cur };
          g.to = { x: nx, y: ny };
          g.stepStart = t;
          g.moving = true;
          g.toggle += 1;
        }
      }

      const next: OverworldSnap = { px, py, dir: g.dir, frame, moving: g.moving };
      const prev = lastSnap.current;
      if (
        prev.px !== next.px ||
        prev.py !== next.py ||
        prev.dir !== next.dir ||
        prev.frame !== next.frame ||
        prev.moving !== next.moving
      ) {
        lastSnap.current = next;
        setSnap(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // キーボード操作（入力欄にフォーカス中は無視）
  useEffect(() => {
    const keyToDir: Record<string, HeroDir> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const dir = keyToDir[e.key];
      if (dir) {
        e.preventDefault();
        press(dir);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = keyToDir[e.key];
      if (dir) release(dir);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [press, release]);

  // 無効化されたら入力をクリア
  useEffect(() => {
    if (!opts.enabled) game.current.pressed = [];
  }, [opts.enabled]);

  return { snap, press, release };
}
