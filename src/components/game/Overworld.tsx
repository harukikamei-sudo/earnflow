import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PixelAnim, PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelImage } from "@/components/pixel/PixelImage";
import { FLOWER, getBuiltinCharacter, HERO_TOPDOWN, ROCK, SIGN, TREE, type HeroDir } from "@/components/pixel/sprites";
import { MAP_H, MAP_W, TILE, townLayout, type Rect, type TownLayout } from "@/game/map";
import { TownLandmark } from "./TownLandmark";
import { THEMES, themeForLevel, townBuildings, townExit, type StageTheme } from "@/game/themes";
import { isWalkable, useCharacter, useMapRows, useProps } from "@/game/mapStore";
import type { OverworldSnap } from "@/game/useOverworld";
import { cn } from "@/lib/utils";

const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

function baseColor(theme: StageTheme, ch: string, x: number, y: number): string {
  const odd = (x + y) % 2;
  if (ch === "N") return odd ? "#ffffff" : "#f1f3f6"; // 真っ白ステージ
  if (ch === "W") return theme.water[odd];
  if (ch === "P" || ch === "D") return theme.path[odd];
  return theme.grass[odd];
}

const OBJECT: Record<string, { sprite: typeof TREE; scale: number }> = {
  T: { sprite: TREE, scale: 2 },
  F: { sprite: FLOWER, scale: 2 },
  S: { sprite: SIGN, scale: 2 },
  R: { sprite: ROCK, scale: 2 },
};

/** タイル下地＋オブジェクト（mapRows / テーマが変わったときだけ再描画） */
const TileLayer = memo(function TileLayer({ rows, theme }: { rows: string[]; theme: StageTheme }) {
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
              style={{ background: baseColor(theme, ch, x, y) }}
            >
              {obj && (
                <div
                  className="absolute inset-0 grid place-items-end justify-center pb-0.5"
                  style={{ filter: theme.objectFilter }}
                >
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

/** バイト先：城（高レベル時）。CSSのドット風フォートレス */
function CastleBuilding({ rect }: { rect: Rect }) {
  const left = rect.x * TILE;
  const width = rect.w * TILE;
  const h = (rect.h + 1) * TILE;
  return (
    <div className="pointer-events-none absolute" style={{ left, top: rect.y * TILE - TILE, width, height: h }}>
      {/* 胸壁（ギザギザの上辺） */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: TILE * 0.5,
          background: "#9aa0ab",
          clipPath: "polygon(0 60%,12% 60%,12% 0,30% 0,30% 60%,44% 60%,44% 0,62% 0,62% 60%,78% 60%,78% 0,100% 0,100% 100%,0 100%)",
        }}
      />
      {/* 本体 */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: TILE * 0.5, background: "linear-gradient(180deg,#8a909b,#6f757f)", border: "3px solid #4a4f59" }}>
        <div className="font-pixel absolute left-1/2 top-1 -translate-x-1/2 rounded-sm bg-[#2a2f4a] px-1 text-[10px] font-bold text-white">¥バイト城</div>
        {/* 門 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "34%", height: "58%", background: "#1c1f27", borderRadius: "50% 50% 0 0 / 70% 70% 0 0" }} />
      </div>
    </div>
  );
}

/** バイト先：洞窟イラスト（無ければCSSの洞窟にフォールバック） */
function ShopBuilding({ castle, rect }: { castle?: boolean; rect: Rect }) {
  const [caveOk, setCaveOk] = useState(true);
  const left = rect.x * TILE;
  const width = rect.w * TILE;
  if (castle) return <CastleBuilding rect={rect} />;
  if (caveOk) {
    return (
      <PixelImage
        src="/illust/cave.png"
        keyWhite
        onError={() => setCaveOk(false)}
        className="pointer-events-none absolute"
        style={{ left, top: (rect.y - 1) * TILE, width, height: "auto" }}
      />
    );
  }
  // フォールバック：CSSの洞窟（cave.png 未配置時）
  const h = (rect.h + 1) * TILE;
  return (
    <div className="pointer-events-none absolute" style={{ left, top: rect.y * TILE - TILE, width, height: h }}>
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

/** どうぐ屋：shop.png があれば画像、無ければCSSのドット風ショップ */
function MarketBuilding({ rect }: { rect: Rect }) {
  const [imgOk, setImgOk] = useState(true);
  const left = rect.x * TILE;
  const width = rect.w * TILE;
  if (imgOk) {
    return (
      <PixelImage
        src="/illust/shop.png"
        onError={() => setImgOk(false)}
        className="pointer-events-none absolute"
        style={{ left, top: (rect.y - 1) * TILE, width, height: "auto" }}
      />
    );
  }
  const h = (rect.h + 1) * TILE;
  return (
    <div className="pointer-events-none absolute" style={{ left, top: rect.y * TILE - TILE, width, height: h }}>
      {/* 屋根（縞のひさし） */}
      <div
        className="absolute left-0 top-0 w-full"
        style={{
          height: TILE * 0.7,
          background: "repeating-linear-gradient(90deg,#c0392b 0 12px,#f4f4f4 12px 24px)",
          borderRadius: "4px 4px 0 0",
        }}
      />
      {/* 壁 */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-center"
        style={{ top: TILE * 0.7, background: "#e3c9a0", border: "3px solid #6b4423" }}
      >
        <div className="font-pixel absolute -top-2 rounded-sm bg-[#2a2f4a] px-1 text-[10px] font-bold text-white">
          どうぐ屋
        </div>
        {/* カウンター窓 */}
        <div className="mb-2 h-[20px] w-[60%] rounded-sm" style={{ background: "#3a2f24", boxShadow: "inset 0 0 0 2px #2a190c" }} />
      </div>
    </div>
  );
}

/** わが家：house.png があれば画像、無ければCSSのドット風ハウス */
function HouseBuilding({ rect }: { rect: Rect }) {
  const [imgOk, setImgOk] = useState(true);
  const left = rect.x * TILE;
  const width = rect.w * TILE;
  if (imgOk) {
    return (
      <PixelImage
        src="/illust/house.png"
        onError={() => setImgOk(false)}
        className="pointer-events-none absolute"
        style={{ left, top: (rect.y - 1) * TILE, width, height: "auto" }}
      />
    );
  }
  const h = (rect.h + 1) * TILE;
  return (
    <div className="pointer-events-none absolute" style={{ left, top: rect.y * TILE - TILE, width, height: h }}>
      {/* 屋根 */}
      <div
        className="absolute left-0 top-0 w-full"
        style={{
          height: TILE,
          background: "#7a4a2b",
          clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
        }}
      />
      {/* 壁 */}
      <div
        className="absolute inset-x-1 bottom-0 flex items-end justify-center"
        style={{ top: TILE - 4, background: "#d8c39a", border: "3px solid #6b4423" }}
      >
        <div className="font-pixel absolute -top-2 rounded-sm bg-[#2a2f4a] px-1 text-[10px] font-bold text-white">
          わが家
        </div>
        {/* ドア */}
        <div className="mb-0 h-[24px] w-[20px] rounded-t bg-[#4a2f17]" />
        {/* 窓 */}
        <div className="absolute left-1.5 top-1.5 h-3 w-3 bg-[#9ad0ff] ring-1 ring-[#6b4423]" />
        <div className="absolute right-1.5 top-1.5 h-3 w-3 bg-[#9ad0ff] ring-1 ring-[#6b4423]" />
      </div>
    </div>
  );
}

/** 派遣住民を町なかで不規則に歩かせるレイヤー */
interface ResidentState {
  id: string;
  cur: { x: number; y: number };
  from: { x: number; y: number };
  to: { x: number; y: number };
  t0: number;
  moving: boolean;
  dir: HeroDir;
  toggle: number;
  frame: number;
  px: number;
  py: number;
  nextAt: number;
}
const RVEC: Record<HeroDir, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const STEP_MS = 420;

const TownResidents = memo(function TownResidents({ ids }: { ids: string[] }) {
  const ref = useRef<ResidentState[]>([]);
  const [, force] = useState(0);
  const idsKey = ids.join(",");

  useEffect(() => {
    ref.current = ids.map((id, i) => {
      const s = RESIDENT_SPOTS[i % RESIDENT_SPOTS.length];
      return {
        id,
        cur: { x: s.x, y: s.y },
        from: { x: s.x, y: s.y },
        to: { x: s.x, y: s.y },
        t0: 0,
        moving: false,
        dir: s.dir,
        toggle: 0,
        frame: 0,
        px: s.x,
        py: s.y,
        nextAt: 0,
      };
    });
    force((v) => v + 1);
  }, [idsKey]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      let changed = false;
      for (const r of ref.current) {
        if (r.moving) {
          const p = Math.min(1, (now - r.t0) / STEP_MS);
          r.px = r.from.x + (r.to.x - r.from.x) * p;
          r.py = r.from.y + (r.to.y - r.from.y) * p;
          r.frame = p < 0.5 ? r.toggle : 1 - r.toggle;
          if (p >= 1) {
            r.cur = { ...r.to };
            r.moving = false;
            r.px = r.cur.x;
            r.py = r.cur.y;
            r.nextAt = now + 300 + Math.random() * 1800; // 不規則な休止
          }
          changed = true;
        } else if (now >= r.nextAt) {
          const dirs: HeroDir[] = ["down", "up", "left", "right"].sort(() => Math.random() - 0.5) as HeroDir[];
          let moved = false;
          for (const d of dirs) {
            const v = RVEC[d];
            const nx = Math.round(r.cur.x) + v.x;
            const ny = Math.round(r.cur.y) + v.y;
            if (isWalkable(nx, ny)) {
              r.from = { ...r.cur };
              r.to = { x: nx, y: ny };
              r.t0 = now;
              r.moving = true;
              r.dir = d;
              r.toggle ^= 1;
              moved = true;
              break;
            }
          }
          if (!moved) r.nextAt = now + 800 + Math.random() * 1200;
          changed = true;
        }
      }
      if (changed) force((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {ref.current.map((r) => {
        const def = getBuiltinCharacter(r.id);
        const isSide = r.dir === "left" || r.dir === "right";
        const set = def ? (r.dir === "up" ? def.up : isSide ? def.side : def.frames) : null;
        const sprite = set ? set[r.frame] ?? set[0] : null;
        return (
          <div
            key={r.id}
            className="absolute"
            style={{ left: r.px * TILE, top: r.py * TILE - 6, width: TILE, height: TILE + 6 }}
          >
            <div className="absolute bottom-1 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-black/30" />
            <div
              className="absolute bottom-1 left-1/2"
              style={{ transform: r.dir === "right" ? "translateX(-50%) scaleX(-1)" : "translateX(-50%)" }}
            >
              {sprite ? (
                <PixelSprite sprite={sprite} scale={2} />
              ) : (
                <PixelImage src={r.id} style={{ width: TILE + 4, height: "auto" }} />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
});

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
  /** 表示する町テーマのインデックス（指定時はレベルでなくこの町の見た目にする） */
  themeIndex?: number;
  /** この町に派遣されている住民キャラのID群（町に立って表示する） */
  residents?: string[];
  /** 町の発展レベル0〜3。にぎわうほど建物が増える */
  devLevel?: number;
}

/** ランドマークの配置候補（主要建物を避けて選ぶ） */
const LM_SPOTS = [
  { x: 11, y: 3 }, { x: 21, y: 3 }, { x: 3, y: 3 }, { x: 20, y: 14 }, { x: 3, y: 14 },
];
function landmarkSpot(L: TownLayout): { x: number; y: number } {
  const rects = [L.shop, L.market, L.house];
  for (const s of LM_SPOTS) {
    const lx = s.x - 1, ly = s.y - 3, lw = 5, lh = 5;
    const hit = rects.some(
      (r) => lx < r.x + r.w + 1 && lx + lw > r.x - 1 && ly < r.y + r.h + 1 && ly + lh > r.y - 2,
    );
    if (!hit) return s;
  }
  return LM_SPOTS[0];
}

/** にぎわいで建つ小さな家 */
function DevHouse({ x, y, roof }: { x: number; y: number; roof: string }) {
  const w = TILE * 1.4;
  return (
    <div className="pointer-events-none absolute" style={{ left: x * TILE, top: y * TILE - TILE * 0.5, width: w, height: w }}>
      <div className="absolute left-0 top-0 w-full" style={{ height: "45%", background: roof, clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
      <div className="absolute inset-x-1 bottom-0" style={{ top: "42%", background: "#e3c9a0", border: "2px solid #6b4423" }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t" style={{ width: "34%", height: "55%", background: "#6b4423" }} />
      </div>
    </div>
  );
}

/** 住民を立たせる場所（建物・水を避けたタイル座標と向き） */
const RESIDENT_SPOTS: { x: number; y: number; dir: HeroDir }[] = [
  { x: 4, y: 6, dir: "down" },
  { x: 8, y: 6, dir: "left" },
  { x: 19, y: 5, dir: "down" },
  { x: 23, y: 13, dir: "up" },
  { x: 8, y: 14, dir: "right" },
  { x: 16, y: 13, dir: "down" },
  { x: 20, y: 11, dir: "left" },
  { x: 13, y: 6, dir: "right" },
  { x: 18, y: 16, dir: "up" },
  { x: 24, y: 5, dir: "down" },
  { x: 14, y: 9, dir: "right" },
  { x: 9, y: 15, dir: "down" },
];

/** トップダウンのマップ描画＋カメラ追従。 */
export function Overworld({
  snap,
  className,
  editMode,
  onTileClick,
  cameraCenter,
  showLandmarks,
  level = 1,
  themeIndex,
  residents = [],
  devLevel = 0,
}: OverworldProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(360);
  const [vh, setVh] = useState(420);
  const rows = useMapRows();
  const props = useProps();
  const character = useCharacter();
  const theme = themeIndex != null ? THEMES[themeIndex] : themeForLevel(level);

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

  // 着せ替えキャラの向き別フレーム（上/横/下）
  const charDef = character ? getBuiltinCharacter(character) : null;
  const charFrames = charDef ? (isSide ? charDef.side : snap.dir === "up" ? charDef.up : charDef.frames) : null;

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
      className={cn("relative overflow-hidden", editMode && "cursor-crosshair", className)}
      style={{ background: theme.bg }}
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
        <TileLayer rows={rows} theme={theme} />

        {showLandmarks && (() => {
          const L = townLayout(themeIndex ?? 0);
          const lm = landmarkSpot(L);
          return (
            <>
              <TownLandmark id={theme.id} x={lm.x} y={lm.y} />
              <ShopBuilding castle={level >= 60} rect={L.shop} />
              <MarketBuilding rect={L.market} />
              <HouseBuilding rect={L.house} />
            </>
          );
        })()}

        {/* 抜け道（となり街へ抜けられる門） */}
        {showLandmarks && themeIndex != null && (() => {
          const ex = townExit(themeIndex);
          return (
            <div className="pointer-events-none absolute" style={{ left: ex.x * TILE - TILE * 0.2, top: ex.y * TILE - TILE * 0.55, width: TILE * 1.4, height: TILE * 1.5 }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-sm" style={{ width: TILE, height: TILE * 0.5, background: "#caa869" }} />
              <div className="absolute left-0 top-0 h-[70%] w-1.5 rounded-sm bg-[#7a4a2b]" />
              <div className="absolute right-0 top-0 h-[70%] w-1.5 rounded-sm bg-[#7a4a2b]" />
              <div className="absolute left-0 top-0 h-1.5 w-full rounded-sm bg-[#a0623a]" />
              <div className="anim-hero-bob absolute left-1/2 top-1 -translate-x-1/2 text-sm">🚪</div>
            </div>
          );
        })()}

        {/* 国ごとに異なる建物レイアウト。発展レベルで軒数が増える */}
        {!editMode &&
          (() => {
            const layout = townBuildings(themeIndex ?? 0);
            const shown = Math.min(layout.length, 2 + devLevel * 2);
            return layout.slice(0, shown).map((b, i) => (
              <DevHouse key={`dev-${i}`} x={b.x} y={b.y} roof={b.roof} />
            ));
          })()}

        {/* 配置された画像プロップ */}
        {props.map((p) => (
          <PixelImage
            key={p.id}
            src={p.src}
            className="pointer-events-none absolute"
            style={{ left: p.x * TILE, top: p.y * TILE, width: p.w * TILE, height: "auto" }}
          />
        ))}

        {/* 派遣された住民（町なかを不規則に歩く） */}
        {!editMode && residents.length > 0 && <TownResidents ids={residents} />}

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
              {!character ? (
                <PixelSprite sprite={heroSprite} scale={2} />
              ) : charFrames ? (
                <PixelAnim frames={charFrames} fps={7} playing={snap.moving} scale={2} />
              ) : (
                <PixelImage src={character} style={{ width: TILE + 4, height: "auto" }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function clamp(want: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, want));
}
