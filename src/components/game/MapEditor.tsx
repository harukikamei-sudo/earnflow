import { useState } from "react";
import { PixelImage } from "@/components/pixel/PixelImage";
import { type TileChar, TOWN_ID } from "@/game/map";
import {
  addAsset,
  addStage,
  deleteStage,
  removeProp,
  resetActive,
  setActiveStage,
  setCharacter,
  setPropWidth,
  useActiveId,
  useAssets,
  useCharacter,
  useProps,
  useStages,
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
  { ch: "N", label: "⬜白" },
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
 * マップエディタ（右カラムの編集パネル）。
 * ステージ・タイル・画像プロップ・キャラクターを編集する。変更は mapStore 経由で
 * 左のプレビューに即反映される。公開時はこのパネルと編集ボタンを外すだけでよい。
 */
export function MapEditor({ brush, setBrush, onClose }: MapEditorProps) {
  const assets = useAssets();
  const props = useProps();
  const stages = useStages();
  const activeId = useActiveId();
  const character = useCharacter();
  const [assetInput, setAssetInput] = useState("");
  const [stageInput, setStageInput] = useState("");

  const isTile = (ch: TileChar) => brush.kind === "tile" && brush.ch === ch;

  function submitAsset() {
    let name = assetInput.trim();
    if (!name) return;
    if (!name.startsWith("/") && !name.startsWith("http")) name = `/illust/${name}`;
    addAsset(name);
    setAssetInput("");
    setBrush({ kind: "prop", src: name });
  }
  function submitStage() {
    addStage(stageInput);
    setStageInput("");
  }

  const chip = (active: boolean) =>
    cn(
      "font-pixel rounded px-2 py-1 text-xs transition-colors",
      active ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
    );

  const section = "font-pixel mb-1 mt-1 text-[11px] font-bold text-gold/90";

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-white">
      <div className="flex items-center justify-between">
        <p className="font-pixel text-sm font-bold tracking-widest text-gold">🛠 編集</p>
        <button type="button" onClick={onClose} className="font-pixel rounded bg-red-500/80 px-3 py-1 text-xs text-white">
          終了
        </button>
      </div>

      {/* ステージ */}
      <p className={section}>ステージ</p>
      <div className="flex flex-wrap gap-1">
        {stages.map((s) => (
          <div key={s.id} className="flex items-center">
            <button type="button" onClick={() => setActiveStage(s.id)} className={chip(s.id === activeId)}>
              {s.name}
            </button>
            {s.id !== TOWN_ID && (
              <button type="button" onClick={() => deleteStage(s.id)} className="font-pixel px-1 text-xs text-red-400">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={stageInput}
          onChange={(e) => setStageInput(e.target.value)}
          placeholder="新ステージ名（真っ白）"
          className="font-pixel h-8 flex-1 rounded bg-white/10 px-2 text-xs text-white placeholder:text-white/40"
        />
        <button type="button" onClick={submitStage} className={chip(false)}>＋追加</button>
        <button type="button" onClick={resetActive} className={chip(false)}>初期化</button>
      </div>

      {/* タイル */}
      <p className={section}>タイル（選んで左のマップをタップ）</p>
      <div className="flex flex-wrap gap-1">
        {TILE_BRUSHES.map((t) => (
          <button key={t.ch} type="button" onClick={() => setBrush({ kind: "tile", ch: t.ch })} className={chip(isTile(t.ch))}>
            {t.label}
          </button>
        ))}
        <button type="button" onClick={() => setBrush({ kind: "erase" })} className={chip(brush.kind === "erase")}>
          🧽初期に戻す
        </button>
      </div>

      {/* 画像プロップ */}
      <p className={section}>画像を配置（選んで左をタップ）</p>
      <div className="flex flex-wrap gap-1">
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
              <PixelImage src={src} style={{ width: 34, height: 34, objectFit: "contain" }} />
              <span className="font-pixel max-w-[60px] truncate text-[9px] text-white/70">{basename(src)}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        <input
          value={assetInput}
          onChange={(e) => setAssetInput(e.target.value)}
          placeholder="画像ファイル名（例 cave.png）"
          className="font-pixel h-8 flex-1 rounded bg-white/10 px-2 text-xs text-white placeholder:text-white/40"
        />
        <button type="button" onClick={submitAsset} className={chip(false)}>追加</button>
      </div>
      <p className="font-pixel text-[10px] text-white/40">※ 画像は public/illust/ に置く（PNG）</p>

      {/* キャラクター */}
      <p className={section}>キャラクター</p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCharacter("")}
          className={cn(
            "font-pixel rounded px-2 py-1 text-xs",
            character === "" ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
          )}
        >
          🧝ドット勇者
        </button>
        {assets.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setCharacter(src)}
            className={cn(
              "rounded p-1 transition-colors",
              character === src ? "bg-gold/30 ring-2 ring-gold" : "bg-white/10 hover:bg-white/20",
            )}
            title={basename(src)}
          >
            <PixelImage src={src} style={{ width: 34, height: 34, objectFit: "contain" }} />
          </button>
        ))}
      </div>

      {/* 配置済みプロップ */}
      {props.length > 0 && (
        <>
          <p className={section}>配置ずみ・サイズ（{props.length}）</p>
          <div className="flex flex-col gap-1">
            {props.map((p) => (
              <div key={p.id} className="flex items-center gap-1 rounded bg-white/5 px-2 py-1">
                <PixelImage src={p.src} style={{ width: 22, height: 22, objectFit: "contain" }} />
                <span className="font-pixel flex-1 truncate text-[11px] text-white/80">{basename(p.src)}</span>
                <button type="button" onClick={() => setPropWidth(p.id, p.w - 2)} className="font-pixel rounded bg-white/10 px-2 text-white">−−</button>
                <button type="button" onClick={() => setPropWidth(p.id, p.w - 1)} className="font-pixel rounded bg-white/10 px-1.5 text-white">−</button>
                <span className="font-pixel w-6 text-center text-[11px] text-gold">{p.w}</span>
                <button type="button" onClick={() => setPropWidth(p.id, p.w + 1)} className="font-pixel rounded bg-white/10 px-1.5 text-white">＋</button>
                <button type="button" onClick={() => setPropWidth(p.id, p.w + 2)} className="font-pixel rounded bg-white/10 px-2 text-white">＋＋</button>
                <button type="button" onClick={() => removeProp(p.id)} className="font-pixel px-1.5 text-red-400">✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
