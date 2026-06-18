import { useRef } from "react";
import type { HeroDir } from "@/components/pixel/sprites";

interface FlickControlsProps {
  onPress: (dir: HeroDir) => void;
  onRelease: (dir: HeroDir) => void;
}

/**
 * フリック / スワイプで移動する透明レイヤー（十字キーの代わり）。
 *
 * 画面のどこでも指（マウス）を置いてドラッグすると、その方向へ歩き続ける。
 * 浮動ジョイスティック方式：原点を指に追従させるので、ドラッグ中に向きを
 * 変えてもすぐ反応する。指を離す/原点付近に戻すと停止。
 * HUD やメニュー・音量ボタンより下に敷くので、それらのタップは妨げない。
 */
const DEAD_ZONE = 14; // この距離未満は移動しない（誤タップ防止）
const STICK_R = 44; // ジョイスティックの追従半径

export function FlickControls({ onPress, onRelease }: FlickControlsProps) {
  const st = useRef<{ id: number | null; ox: number; oy: number; dir: HeroDir | null }>({
    id: null,
    ox: 0,
    oy: 0,
    dir: null,
  });

  function setDir(dir: HeroDir | null) {
    const s = st.current;
    if (s.dir === dir) return;
    if (s.dir) onRelease(s.dir);
    s.dir = dir;
    if (dir) onPress(dir);
  }

  function end() {
    setDir(null);
    st.current.id = null;
  }

  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerDown={(e) => {
        st.current.id = e.pointerId;
        st.current.ox = e.clientX;
        st.current.oy = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (s.id !== e.pointerId) return;
        let dx = e.clientX - s.ox;
        let dy = e.clientY - s.oy;
        const dist = Math.hypot(dx, dy);
        // 原点を指に追従させる（スティックを一定半径に保つ）
        if (dist > STICK_R) {
          s.ox = e.clientX - (dx / dist) * STICK_R;
          s.oy = e.clientY - (dy / dist) * STICK_R;
          dx = e.clientX - s.ox;
          dy = e.clientY - s.oy;
        }
        if (Math.hypot(dx, dy) < DEAD_ZONE) {
          setDir(null);
          return;
        }
        setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    />
  );
}
