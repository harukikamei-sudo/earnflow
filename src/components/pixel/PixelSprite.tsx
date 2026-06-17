import { useEffect, useMemo, useState } from "react";
import type { Sprite } from "./sprites";
import { cn } from "@/lib/utils";

interface PixelSpriteProps {
  sprite: Sprite;
  /** 1ピクセルあたりの表示サイズ(px) */
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ドット絵スプライトを SVG の矩形に展開して描画する。
 * shapeRendering="crispEdges" でドットのエッジをくっきり保つ。
 */
export function PixelSprite({ sprite, scale = 4, className, style }: PixelSpriteProps) {
  const { grid, palette } = sprite;

  const { width, height, rects } = useMemo(() => {
    const h = grid.length;
    const w = grid.reduce((max, row) => Math.max(max, row.length), 0);
    const cells: { x: number; y: number; fill: string }[] = [];
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const fill = palette[row[x]];
        if (fill) cells.push({ x, y, fill });
      }
    });
    return { width: w, height: h, rects: cells };
  }, [grid, palette]);

  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={1.02} height={1.02} fill={r.fill} />
      ))}
    </svg>
  );
}

/**
 * 複数フレームを一定間隔で切り替えてパラパラ漫画にする（歩行アニメ等）。
 * playing=false のときは最初のフレームで静止する。
 */
export function PixelAnim({
  frames,
  fps = 6,
  playing = true,
  scale = 4,
  className,
  style,
}: {
  frames: Sprite[];
  fps?: number;
  playing?: boolean;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // 静止中（playing=false / 単一フレーム）は下で frames[0] を表示するので何もしない
    if (!playing || frames.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % frames.length),
      Math.max(60, 1000 / fps),
    );
    return () => window.clearInterval(id);
  }, [playing, frames.length, fps]);

  const frame = frames[playing ? index % frames.length : 0] ?? frames[0];
  return <PixelSprite sprite={frame} scale={scale} className={className} style={style} />;
}

/** スプライトを指定クラスでラップして表示（アニメーション付与用） */
export function PixelSpriteBox({
  sprite,
  scale,
  wrapClassName,
  spriteClassName,
}: {
  sprite: Sprite;
  scale?: number;
  wrapClassName?: string;
  spriteClassName?: string;
}) {
  return (
    <div className={cn("inline-block", wrapClassName)}>
      <PixelSprite sprite={sprite} scale={scale} className={spriteClassName} />
    </div>
  );
}
