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
  setPropWidth,
  useActiveId,
  useAssets,
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
 * マップエディタ（編集モードのダッシュボード）。
 * ステージの追加/切替、タイル塗り、画像プロップの配置/サイズ/削除、アセット追加。
 * 公開時はこのパネルと編集ボタンを外すだけでよい。
 */
export function MapEditor({ brush, setBrush, onClose }: MapEditorProps) {
  const assets = useAssets();
  const props = useProps();
  const stages = useStages();
  const activeId = useActiveId();
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

  return (
    <div className="dq-window pointer-events-auto absolute inset-x-2 top-14 z-40 max-h-[64vh] overflow-y-auto no-scrollbar px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-pixel text-xs font-bold tracking-widest text-gold">🛠 マップエディタ</p>
        <div className="flex gap-1">
          <button type="button" onClick={resetActive} className={chip(false)}>
            初期化
          </button>
          <button type="button" onClick={onClose} className="font-pixel rounded bg-red-500/80 px-2 py-1 text-xs text-white">
            とじる
          </button>
        </div>
      </div>

      {/* ステージ */}
      <p className="font-pixel mb-1 text-[11px] text-white/60">ステージ（切替/追加）</p>
      <div className="mb-1 flex flex-wrap gap-1">
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
      <div className="mb-2 flex gap-1">
        <input
          value={stageInput}
          onChange={(e) => setStageInput(e.target.value)}
          placeholder="新ステージ名（真っ白で追加）"
          className="font-pixel h-8 flex-1 rounded bg-white/10 px-2 text-xs text-white placeholder:text-white/40"
        />
        <button type="button" onClick={submitStage} className={chip(false)}>
          ＋追加
        </button>
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
              <PixelImage src={src} style={{ width: 36, height: 36, objectFit: "contain" }} />
              <span className="font-pixel max-w-[64px] truncate text-[9px] text-white/70">{basename(src)}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-1 flex gap-1">
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
        ※ 画像は public/illust/ に置く（dot-illust.net 等のPNG）
      </p>

      {/* 配置済みプロップ（サイズ変更・削除） */}
      {props.length > 0 && (
        <>
          <p className="font-pixel mb-1 text-[11px] text-white/60">配置ずみ・サイズ変更（{props.length}）</p>
          <div className="flex flex-col gap-1">
            {props.map((p) => (
              <div key={p.id} className="flex items-center gap-1 rounded bg-white/5 px-2 py-1">
                <PixelImage src={p.src} style={{ width: 22, height: 22, objectFit: "contain" }} />
                <span className="font-pixel flex-1 truncate text-[11px] text-white/80">{basename(p.src)}</span>
                <span className="font-pixel text-[10px] text-white/40">({p.x},{p.y})</span>
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
