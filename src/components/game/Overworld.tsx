import { memo, useLayoutEffect, useRef, useState } from "react";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelImage } from "@/components/pixel/PixelImage";
import { FLOWER, HERO_TOPDOWN, ROCK, SIGN, TREE } from "@/components/pixel/sprites";
import { CASTLE, MAP, MAP_H, MAP_W, SHOP, TILE } from "@/game/map";
import type { OverworldSnap } from "@/game/useOverworld";
import { cn } from "@/lib/utils";

const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

const GRASS = ["#3f9e44", "#43a548"];
const PATH = ["#caa869", "#c19f60"];
const WATER = ["#2f6fd0", "#3577da"];

function baseColor(ch: string, x: number, y: number): string {
  const odd = (x + y) % 2;
  if (ch === "W") return WATER[odd];
  if (ch === "P" || ch === "D") return PATH[odd];
  return GRASS[odd]; // G/F/T/S/R/B はすべて草を下地に
}

const OBJECT: Record<string, { sprite: typeof TREE; scale: number }> = {
  T: { sprite: TREE, scale: 2 },
  F: { sprite: FLOWER, scale: 2 },
  S: { sprite: SIGN, scale: 2 },
  R: { sprite: ROCK, scale: 2 },
};

/** タイル下地＋オブジェクト（静的なのでメモ化して毎フレーム再描画しない） */
const TileLayer = memo(function TileLayer() {
  return (
    <div
      className="absolute left-0 top-0 grid"
      style={{
        width: WORLD_W,
        height: WORLD_H,
        gridTemplateColumns: `repeat(${MAP_W}, ${TILE}px)`,
        gridTemplateRows: `repeat(${MAP_H}, ${TILE}px)`,
      }}
    >
      {MAP.flatMap((row, y) =>
        row.split("").map((ch, x) => {
          const obj = OBJECT[ch];
          return (
            <div
              key={`${x}-${y}`}
              className={cn("relative", ch === "W" && "anim-water")}
              style={{ background: baseColor(ch, x, y) }}
            >
              {obj && (
                <div className="absolute inset-0 grid place-items-end justify-center pb-0.5">
                  <PixelSprite sprite={obj.sprite} scale={obj.scale} />
                </div>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
});

/** バイト先の建物（CSSのドット風ハウス） */
function Shop() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: SHOP.x * TILE,
        top: (SHOP.y - 1) * TILE,
        width: SHOP.w * TILE,
        height: (SHOP.h + 1) * TILE,
      }}
    >
      {/* 屋根 */}
      <div
        className="absolute left-0 top-0 w-full"
        style={{
          height: TILE,
          background: "#c0392b",
          clipPath: "polygon(12% 100%, 0 100%, 18% 0, 82% 0, 100% 100%, 88% 100%)",
          boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.25)",
        }}
      />
      {/* 壁 */}
      <div
        className="absolute left-1 top-[28px] flex w-[calc(100%-8px)] items-end justify-center"
        style={{ height: TILE * SHOP.h - 4, background: "#e3c9a0", border: "3px solid #6b4423" }}
      >
        {/* 看板 ¥ */}
        <div
          className="font-pixel absolute -top-1 rounded-sm px-1 text-[10px] font-bold text-white"
          style={{ background: "#2a2f4a" }}
        >
          ¥バイト
        </div>
        {/* ドア */}
        <div
          className="mb-0 h-[26px] w-[22px] rounded-t"
          style={{ background: "#4a2f17", boxShadow: "inset 0 0 0 2px #2a190c" }}
        />
      </div>
    </div>
  );
}

interface OverworldProps {
  snap: OverworldSnap;
  className?: string;
}

/** トップダウンのマップ描画＋カメラ追従。 */
export function Overworld({ snap, className }: OverworldProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(360);
  const [vh, setVh] = useState(420);

  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const update = () => {
      setVw(el.clientWidth);
      setVh(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ワールドが必ずビューを覆うスケール（余白を出さず画面の角に合わせる）
  const scale = Math.max(vw / WORLD_W, vh / WORLD_H);
  const visW = vw / scale;
  const visH = vh / scale;
  const heroCx = (snap.px + 0.5) * TILE;
  const heroCy = (snap.py + 0.5) * TILE;
  const camX = clamp(heroCx - visW / 2, 0, Math.max(0, WORLD_W - visW));
  const camY = clamp(heroCy - visH / 2, 0, Math.max(0, WORLD_H - visH));

  const isSide = snap.dir === "left" || snap.dir === "right";
  const frames = isSide
    ? HERO_TOPDOWN.side
    : snap.dir === "up"
      ? HERO_TOPDOWN.up
      : HERO_TOPDOWN.down;
  const heroSprite = frames[snap.frame] ?? frames[0];

  return (
    <div
      ref={viewRef}
      className={cn("relative overflow-hidden bg-[#2f7d36]", className)}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transformOrigin: "0 0",
          transform: `translate(${-camX * scale}px, ${-camY * scale}px) scale(${scale})`,
        }}
      >
        <TileLayer />

        {/* 城（ランドマーク・イラスト） */}
        <PixelImage
          src="/illust/castle.jpeg"
          className="pointer-events-none absolute"
          style={{
            left: CASTLE.x * TILE,
            top: CASTLE.y * TILE - 10,
            width: CASTLE.w * TILE,
            height: "auto",
          }}
        />

        <Shop />

        {/* 勇者 */}
        <div
          className="absolute"
          style={{
            left: snap.px * TILE,
            top: snap.py * TILE - 6,
            width: TILE,
            height: TILE + 6,
          }}
        >
          <div className="absolute bottom-1 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-black/30" />
          <div
            className="absolute bottom-1 left-1/2"
            style={{
              transform:
                snap.dir === "right"
                  ? "translateX(-50%) scaleX(-1)"
                  : "translateX(-50%)",
            }}
          >
            <PixelSprite sprite={heroSprite} scale={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(want: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, want));
}
