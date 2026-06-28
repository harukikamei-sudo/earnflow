import { useMemo, useState } from "react";
import { PixelAnim, PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelImage } from "@/components/pixel/PixelImage";
import { CHARACTERS, getBuiltinCharacter, HERO_DOWN_A, type Rarity } from "@/components/pixel/sprites";
import { useOwned } from "@/game/playerStore";
import { useAssets, useCharacter, setCharacter } from "@/game/mapStore";
import { playSE } from "@/audio/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const PER_PAGE = 6;
const RARITY_ORDER: Rarity[] = ["UR", "SSR", "SR", "R", "N"];
const RSTYLE: Record<Rarity, { label: string; color: string }> = {
  N: { label: "ノーマル", color: "#9a8c6a" },
  R: { label: "レア", color: "#2e74c4" },
  SR: { label: "スーパーレア", color: "#7d4fd0" },
  SSR: { label: "SSレア", color: "#c79a16" },
  UR: { label: "激レア", color: "#d63a36" },
};

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}

interface Entry {
  id: string;
  name: string;
  rarity: Rarity;
  bio?: string;
  line?: string;
}

function Thumb({ id, scale = 2 }: { id: string; scale?: number }) {
  if (id === "") return <PixelSprite sprite={HERO_DOWN_A} scale={scale} />;
  const b = getBuiltinCharacter(id);
  if (b) return <PixelSprite sprite={b.frames[0]} scale={scale} />;
  return <PixelImage src={id} style={{ width: 18 * scale, height: 18 * scale, objectFit: "contain" }} />;
}

/**
 * 図鑑（本めくりビューア）。得たキャラを本のページ（1ページ6体）でめくって見られる。
 * 各キャラをタップするとプロフィール（性格・小ネタ）を表示する。
 */
export function Dexbook({ onClose }: { onClose: () => void }) {
  const t = useT();
  const owned = useOwned();
  const assets = useAssets();
  const character = useCharacter();
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<"l" | "r" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [
      { id: "", name: t("costume.default"), rarity: "N", bio: "あなた自身。バイトに明け暮れる毎日。いつか働かずに暮らすのが夢。" },
    ];
    for (const c of CHARACTERS) {
      if (owned.includes(c.id)) list.push({ id: c.id, name: c.name, rarity: c.rarity ?? "N", bio: c.bio, line: c.line });
    }
    for (const a of assets) {
      if (owned.includes(a)) list.push({ id: a, name: basename(a), rarity: "N" });
    }
    const rank = (r: Rarity) => RARITY_ORDER.indexOf(r);
    return list.sort((a, b) => rank(a.rarity) - rank(b.rarity));
  }, [owned, assets, t]);

  const pageCount = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const cur = Math.min(page, pageCount - 1);
  const pageEntries = entries.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);
  const detail = selected !== null ? entries.find((e) => e.id === selected) ?? null : null;

  function turn(dir: -1 | 1) {
    const next = cur + dir;
    if (next < 0 || next >= pageCount) return;
    playSE("confirm");
    setFlip(dir === 1 ? "r" : "l");
    setPage(next);
    window.setTimeout(() => setFlip(null), 360);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-3 py-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg p-3"
        style={{ background: "linear-gradient(180deg,#6b4423,#4a2f17)", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}
      >
        {/* 見出し */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-pixel text-lg font-bold text-[#f6e6c0]">📖 ずかん</h2>
          <span className="font-pixel text-[11px] text-[#e8d9a0]">{entries.length} 体</span>
          <button
            type="button"
            onClick={() => {
              playSE("cancel");
              onClose();
            }}
            className="font-pixel rounded bg-black/30 px-3 py-1 text-xs text-[#f6e6c0]"
          >
            ✕
          </button>
        </div>

        {/* 本のページ（羊皮紙）。中身ぴったりの高さ（余白なし） */}
        <div className="overflow-hidden rounded" style={{ perspective: 1200 }}>
          <div
            key={cur}
            className={cn(
              "no-scrollbar max-h-[64vh] overflow-y-auto rounded p-3",
              flip === "r" && "anim-page-r",
              flip === "l" && "anim-page-l",
            )}
            style={{ background: "linear-gradient(180deg,#f3e7c6,#e7d6ad)", transformOrigin: flip === "r" ? "left center" : "right center" }}
          >
            <div className="grid grid-cols-2 gap-2">
              {pageEntries.map((e) => {
                const rs = RSTYLE[e.rarity];
                const equipped = character === e.id;
                return (
                  <button
                    key={e.id || "default"}
                    type="button"
                    onClick={() => {
                      playSE("confirm");
                      setSelected(e.id);
                    }}
                    className="relative flex items-center gap-2 rounded-md border-2 bg-[#fbf3da] p-2 text-left transition-transform hover:-translate-y-0.5"
                    style={{ borderColor: rs.color }}
                  >
                    <span className="absolute right-1 top-1 font-pixel rounded px-1 text-[8px] font-bold text-white" style={{ background: rs.color }}>
                      {e.rarity}
                    </span>
                    <div className="grid h-12 w-12 shrink-0 place-items-center">
                      <Thumb id={e.id} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-pixel truncate text-[11px] font-bold text-[#3a2a14]">{e.name}</p>
                      <p className="font-pixel text-[9px]" style={{ color: rs.color }}>{rs.label}</p>
                      {equipped && <p className="font-pixel text-[9px] font-bold text-[#a8801a]">{t("costume.equipped")}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            {pageEntries.length === 0 && (
              <p className="font-pixel mt-8 text-center text-sm text-[#7a5a2a]">まだ 図鑑が からっぽ。</p>
            )}
          </div>
        </div>

        {/* ページ送り */}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            disabled={cur <= 0}
            onClick={() => turn(-1)}
            className={cn("font-pixel rounded px-4 py-1.5 text-sm font-bold", cur <= 0 ? "bg-black/20 text-[#caa869]/40" : "bg-[#f6c945] text-black")}
          >
            ◀
          </button>
          <span className="font-pixel text-sm text-[#f6e6c0]">{cur + 1} / {pageCount}</span>
          <button
            type="button"
            disabled={cur >= pageCount - 1}
            onClick={() => turn(1)}
            className={cn("font-pixel rounded px-4 py-1.5 text-sm font-bold", cur >= pageCount - 1 ? "bg-black/20 text-[#caa869]/40" : "bg-[#f6c945] text-black")}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 詳細（プロフィール） */}
      {detail && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 px-6" onClick={() => setSelected(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-dq-pop w-full max-w-xs rounded-lg p-4"
            style={{ background: "linear-gradient(180deg,#f3e7c6,#e7d6ad)", border: `3px solid ${RSTYLE[detail.rarity].color}` }}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded" style={{ boxShadow: `0 0 14px 2px ${RSTYLE[detail.rarity].color}66` }}>
                {detail.id === "" ? (
                  <PixelSprite sprite={HERO_DOWN_A} scale={3} />
                ) : getBuiltinCharacter(detail.id) ? (
                  <PixelAnim frames={getBuiltinCharacter(detail.id)!.frames} fps={6} playing scale={3} />
                ) : (
                  <PixelImage src={detail.id} style={{ width: 64, height: 64, objectFit: "contain" }} />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-pixel rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: RSTYLE[detail.rarity].color }}>
                  {detail.rarity} ・ {RSTYLE[detail.rarity].label}
                </span>
                <p className="font-pixel mt-1 text-base font-bold text-[#3a2a14]">{detail.name}</p>
              </div>
            </div>

            {detail.bio && <p className="font-pixel mt-3 text-[12px] leading-relaxed text-[#4a3a1e]">{detail.bio}</p>}
            {detail.line && <p className="font-pixel mt-2 text-[11px] italic text-[#7a5a2a]">「{detail.line}」</p>}

            <div className="mt-3 flex gap-2">
              {character !== detail.id && (
                <button
                  type="button"
                  onClick={() => {
                    setCharacter(detail.id);
                    playSE("confirm");
                  }}
                  className="font-pixel flex-1 rounded bg-[#f6c945] py-1.5 text-sm font-bold text-black"
                >
                  {t("costume.equip")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="font-pixel flex-1 rounded bg-black/20 py-1.5 text-sm text-[#3a2a14]"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
