import { memo, useLayoutEffect, useRef, useState } from "react";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelImage } from "@/components/pixel/PixelImage";
import { FLOWER, HERO_TOPDOWN, ROCK, SIGN, TREE } from "@/components/pixel/sprites";
import { MAP_H, MAP_W, SHOP, TILE } from "@/game/map";
import { useCharacter, useMapRows, useProps } from "@/game/mapStore";
import type { OverworldSnap } from "@/game/useOverworld";
import { cn } from "@/lib/utils";

const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

const GRASS = ["#3f9e44", "#43a548"];
const PATH = ["#caa869", "#c19f60"];
const WATER = ["#2f6fd0", "#3577da"];

function baseColor(ch: string, x: number, y: number): string {
  const odd = (x + y) % 2;
  if (ch === "N") return odd ? "#ffffff" : "#f1f3f6"; // 真っ白ステージ
  if (ch === "W") return WATER[odd];
  if (ch === "P" || ch === "D") return PATH[odd];
  return GRASS[odd];
}

const OBJECT: Record<string, { sprite: typeof TREE; scale: number }> = {
  T: { sprite: TREE, scale: 2 },
  F: { sprite: FLOWER, scale: 2 },
  S: { sprite: SIGN, scale: 2 },
  R: { sprite: ROCK, scale: 2 },
};

/** タイル下地＋オブジェクト（mapRows が変わったときだけ再描画） */
const TileLayer = memo(function TileLayer({ rows }: { rows: string[] }) {
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
      {rows.flatMap((row, y) =>
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

/** バイト先：洞窟イラスト（無ければCSSの家にフォールバック） */
function ShopBuilding() {
  const [caveOk, setCaveOk] = useState(true);
  const left = SHOP.x * TILE;
  const width = SHOP.w * TILE;
  if (caveOk) {
    return (
      <PixelImage
        src="/illust/cave.png"
        keyWhite
        onError={() => setCaveOk(false)}
        className="pointer-events-none absolute"
        style={{ left, top: (SHOP.y - 1) * TILE, width, height: "auto" }}
      />
    );
  }
  // フォールバック：CSSの洞窟（cave.png 未配置時）
  const h = (SHOP.h + 1) * TILE;
  return (
    <div className="pointer-events-none absolute" style={{ left, top: SHOP.y * TILE - TILE, width, height: h }}>
      {/* 岩山 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: h - 6,
          background: "linear-gradient(180deg,#9aa0ab 0%,#6f757f 60%,#565b64 100%)",
          borderRadius: "48% 48% 12% 12% / 70% 70% 12% 12%",
          boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.25)",
        }}
      />
      {/* 洞窟の入口 */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "44%",
          height: "60%",
          background: "radial-gradient(120% 100% at 50% 100%, #000 60%, #1c1f27 100%)",
          borderRadius: "50% 50% 0 0 / 80% 80% 0 0",
        }}
      />
      {/* 看板 */}
      <div className="font-pixel absolute left-1/2 top-1 -translate-x-1/2 rounded-sm bg-[#2a2f4a] px-1 text-[10px] font-bold text-white">
        ¥バイト
      </div>
    </div>
  );
}

interface OverworldProps {
  snap: OverworldSnap;
  className?: string;
  /** 編集モード：勇者を隠し、タップでタイル座標を返す */
  editMode?: boolean;
  onTileClick?: (x: number, y: number) => void;
  /** カメラ中心（タイル座標）。指定時は勇者ではなくここを中心にする（編集の視点移動用） */
  cameraCenter?: { x: number; y: number };
  /** 城・バイト先などのランドマークを描画するか（まちステージのみ true） */
  showLandmarks?: boolean;
  /** プレイヤーレベル（ステージ演出に使う） */
  level?: number;
}

/** トップダウンのマップ描画＋カメラ追従。 */
export function Overworld({
  snap,
  className,
  editMode,
  onTileClick,
  cameraCenter,
  showLandmarks,
  level = 1,
}: OverworldProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(360);
  const [vh, setVh] = useState(420);
  const rows = useMapRows();
  const props = useProps();
  const character = useCharacter();

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

  const scale = Math.max(vw / WORLD_W, vh / WORLD_H);
  const visW = vw / scale;
  const visH = vh / scale;
  const cx = cameraCenter ? cameraCenter.x * TILE : (snap.px + 0.5) * TILE;
  const cy = cameraCenter ? cameraCenter.y * TILE : (snap.py + 0.5) * TILE;
  const camX = clamp(cx - visW / 2, 0, Math.max(0, WORLD_W - visW));
  const camY = clamp(cy - visH / 2, 0, Math.max(0, WORLD_H - visH));

  const isSide = snap.dir === "left" || snap.dir === "right";
  const frames = isSide
    ? HERO_TOPDOWN.side
    : snap.dir === "up"
      ? HERO_TOPDOWN.up
      : HERO_TOPDOWN.down;
  const heroSprite = frames[snap.frame] ?? frames[0];

  function handlePointer(e: React.PointerEvent) {
    if (!editMode || !onTileClick) return;
    const el = viewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const wx = (e.clientX - rect.left) / scale + camX;
    const wy = (e.clientY - rect.top) / scale + camY;
    onTileClick(Math.floor(wx / TILE), Math.floor(wy / TILE));
  }

  return (
    <div
      ref={viewRef}
      className={cn("relative overflow-hidden bg-[#3f9e44]", editMode && "cursor-crosshair", className)}
      onPointerDown={handlePointer}
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
        <TileLayer rows={rows} />

        {showLandmarks && <ShopBuilding />}

        {/* 配置された画像プロップ */}
        {props.map((p) => (
          <PixelImage
            key={p.id}
            src={p.src}
            className="pointer-events-none absolute"
            style={{ left: p.x * TILE, top: p.y * TILE, width: p.w * TILE, height: "auto" }}
          />
        ))}

        {/* 編集グリッド */}
        {editMode && (
          <div
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: WORLD_W,
              height: WORLD_H,
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.25) 1px, transparent 1px)",
              backgroundSize: `${TILE}px ${TILE}px`,
            }}
          />
        )}

        {/* 勇者（編集中は非表示） */}
        {!editMode && (
          <div
            className="absolute"
            style={{ left: snap.px * TILE, top: snap.py * TILE - 6, width: TILE, height: TILE + 6 }}
          >
            <div className="absolute bottom-1 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-black/30" />
            <div
              className="absolute bottom-1 left-1/2"
              style={{
                transform: snap.dir === "right" ? "translateX(-50%) scaleX(-1)" : "translateX(-50%)",
              }}
            >
              {character ? (
                <PixelImage src={character} style={{ width: TILE + 4, height: "auto" }} />
              ) : (
                <PixelSprite sprite={heroSprite} scale={2} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* レベル演出：Lv10〜 霧 / Lv20〜 うす暗く */}
      {level >= 20 && (
        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(16,20,46,0.30)" }} />
      )}
      {level >= 10 && (
        <div
          className="anim-fog pointer-events-none absolute inset-0"
          style={{ opacity: Math.min(0.5, 0.18 + (level - 10) * 0.012) }}
        />
      )}
    </div>
  );
}

function clamp(want: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, want));
}
