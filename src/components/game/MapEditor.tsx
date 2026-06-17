import { useState } from "react";
import { PixelImage } from "@/components/pixel/PixelImage";
import type { TileChar } from "@/game/map";
import {
  addAsset,
  removeProp,
  resetMap,
  setPropWidth,
  useAssets,
  useProps,
} from "@/game/mapStore";
import { cn } from "@/lib/utils";

export type Brush =
  | { kind: "tile"; ch: TileChar }
  | { kind: "erase" }
  | { kind: "prop"; src: string };

const TILE_BRUSHES: { ch: TileChar; label: string }[] = [
  { ch: "G", label: "🟩草" },
  { ch: "P", label: "🟫道" },
  { ch: "W", label: "🟦水" },
  { ch: "T", label: "🌳木" },
  { ch: "R", label: "🪨岩" },
  { ch: "F", label: "🌸花" },
  { ch: "S", label: "🪧看板" },
];

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}

interface MapEditorProps {
  brush: Brush;
  setBrush: (b: Brush) => void;
  onClose: () => void;
}

/**
 * マップエディタ（編集モードのダッシュボード）。
 * タイルのブラシ選択・画像プロップの選択/追加・配置済みプロップの管理・リセット。
 * 公開時はこのパネルと編集ボタンを外すだけでよい。
 */
export function MapEditor({ brush, setBrush, onClose }: MapEditorProps) {
  const assets = useAssets();
  const props = useProps();
  const [assetInput, setAssetInput] = useState("");

  const isTile = (ch: TileChar) => brush.kind === "tile" && brush.ch === ch;

  function submitAsset() {
    let name = assetInput.trim();
    if (!name) return;
    if (!name.startsWith("/") && !name.startsWith("http")) name = `/illust/${name}`;
    addAsset(name);
    setAssetInput("");
    setBrush({ kind: "prop", src: name });
  }

  const chip = (active: boolean) =>
    cn(
      "font-pixel rounded px-2 py-1 text-xs transition-colors",
      active ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
    );

  return (
    <div className="dq-window pointer-events-auto absolute inset-x-2 bottom-2 z-40 max-h-[46vh] overflow-y-auto no-scrollbar px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-pixel text-xs font-bold tracking-widest text-gold">
          🛠 マップエディタ（編集モード）
        </p>
        <div className="flex gap-1">
          <button type="button" onClick={resetMap} className={chip(false)}>
            リセット
          </button>
          <button type="button" onClick={onClose} className="font-pixel rounded bg-red-500/80 px-2 py-1 text-xs text-white">
            とじる
          </button>
        </div>
      </div>

      {/* タイルブラシ */}
      <p className="font-pixel mb-1 text-[11px] text-white/60">タイル（タップで塗る）</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {TILE_BRUSHES.map((t) => (
          <button key={t.ch} type="button" onClick={() => setBrush({ kind: "tile", ch: t.ch })} className={chip(isTile(t.ch))}>
            {t.label}
          </button>
        ))}
        <button type="button" onClick={() => setBrush({ kind: "erase" })} className={chip(brush.kind === "erase")}>
          🧽消す
        </button>
      </div>

      {/* 画像プロップ */}
      <p className="font-pixel mb-1 text-[11px] text-white/60">画像を配置（選んでマップをタップ）</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {assets.map((src) => {
          const active = brush.kind === "prop" && brush.src === src;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setBrush({ kind: "prop", src })}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded p-1 transition-colors",
                active ? "bg-gold/30 ring-2 ring-gold" : "bg-white/10 hover:bg-white/20",
              )}
              title={basename(src)}
            >
              <PixelImage src={src} className="h-9 w-9 object-contain" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <span className="font-pixel max-w-[64px] truncate text-[9px] text-white/70">{basename(src)}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-2 flex gap-1">
        <input
          value={assetInput}
          onChange={(e) => setAssetInput(e.target.value)}
          placeholder="画像ファイル名（例 cave.png）"
          className="font-pixel h-8 flex-1 rounded bg-white/10 px-2 text-xs text-white placeholder:text-white/40"
        />
        <button type="button" onClick={submitAsset} className={chip(false)}>
          追加
        </button>
      </div>
      <p className="font-pixel mb-2 text-[10px] text-white/40">
        ※ 画像は public/illust/ に置いてください（dot-illust.net 等のPNG）
      </p>

      {/* 配置済みプロップ */}
      {props.length > 0 && (
        <>
          <p className="font-pixel mb-1 text-[11px] text-white/60">配置ずみ（{props.length}）</p>
          <div className="flex flex-col gap-1">
            {props.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1">
                <PixelImage src={p.src} style={{ width: 24, height: 24, objectFit: "contain" }} />
                <span className="font-pixel flex-1 truncate text-[11px] text-white/80">{basename(p.src)}</span>
                <span className="font-pixel text-[10px] text-white/50">({p.x},{p.y})</span>
                <button type="button" onClick={() => setPropWidth(p.id, p.w - 1)} className="font-pixel px-1.5 text-white">−</button>
                <span className="font-pixel w-6 text-center text-[11px] text-white">{p.w}</span>
                <button type="button" onClick={() => setPropWidth(p.id, p.w + 1)} className="font-pixel px-1.5 text-white">＋</button>
                <button type="button" onClick={() => removeProp(p.id)} className="font-pixel px-1.5 text-red-400">✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
