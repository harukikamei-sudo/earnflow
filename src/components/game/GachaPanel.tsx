import { useState } from "react";
import { PixelImage } from "@/components/pixel/PixelImage";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { CHARACTERS, getBuiltinCharacter, HERO_DOWN_A } from "@/components/pixel/sprites";
import { DQWindow } from "@/components/pixel/DQWindow";
import { setCharacter, useAssets, useCharacter } from "@/game/mapStore";
import { gachaPull, isOwned, useOwned, useWallet, type GachaResult } from "@/game/playerStore";
import { playSE } from "@/audio/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** ガチャ1回の値段 / ダブり時の返金（ゴールド） */
const PRICE = 300;
const DUP_REFUND = 100;

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}

function Thumb({ id, scale = 2 }: { id: string; scale?: number }) {
  if (id === "") return <PixelSprite sprite={HERO_DOWN_A} scale={scale} />;
  const builtin = getBuiltinCharacter(id);
  if (builtin) return <PixelSprite sprite={builtin.frames[0]} scale={scale} />;
  return <PixelImage src={id} style={{ width: 18 * scale, height: 18 * scale, objectFit: "contain" }} />;
}

function nameOf(id: string, t: (k: string) => string): string {
  if (id === "") return t("costume.default");
  return getBuiltinCharacter(id) ? t(`char.${id}`) : basename(id);
}

/**
 * どうぐ屋のガチャポン。ゴールドを払うとランダムでコスチュームが出る。
 * 新規ならゲット＆自動で着用、ダブりなら一部返金。所持品はコレクションから着替え可能。
 */
export function GachaPanel() {
  const t = useT();
  const assets = useAssets();
  const wallet = useWallet();
  useOwned(); // 所持変化で再描画
  const character = useCharacter();

  const [result, setResult] = useState<GachaResult | null>(null);
  const [rolling, setRolling] = useState(false);

  const pool = [...CHARACTERS.map((c) => c.id), ...assets];
  const canRoll = wallet >= PRICE && !rolling;

  function roll() {
    if (!canRoll) return;
    setRolling(true);
    setResult(null);
    playSE("confirm");
    window.setTimeout(() => {
      const res = gachaPull(PRICE, pool, DUP_REFUND);
      setRolling(false);
      if (res) {
        setResult(res);
        if (res.isNew) {
          setCharacter(res.id); // 新規は自動で着用
          playSE("levelup");
        }
      }
    }, 800);
  }

  const collection = [
    { src: "", name: t("costume.default") },
    ...CHARACTERS.map((c) => ({ src: c.id, name: t(`char.${c.id}`) })),
    ...assets.map((s) => ({ src: s, name: basename(s) })),
  ];

  return (
    <>
      {/* ガチャ機 */}
      <DQWindow title={t("gacha.title")}>
        <div className="mb-2 flex items-center justify-between font-pixel text-sm">
          <span>{t("gacha.lead")}</span>
          <span className="text-gold">💰 {wallet} G</span>
        </div>

        {/* 結果表示 / カプセル */}
        <div className="mb-3 grid min-h-[120px] place-items-center rounded-md bg-black/30 p-3">
          {rolling ? (
            <div className="anim-hero-bob text-4xl">🥚</div>
          ) : result ? (
            <div className="anim-dq-pop flex flex-col items-center gap-1 text-center">
              <Thumb id={result.id} scale={3} />
              <span className="font-pixel text-sm font-bold text-white">{nameOf(result.id, t)}</span>
              {result.isNew ? (
                <span className="font-pixel rounded bg-gold px-2 py-0.5 text-[11px] font-bold text-black">
                  ✨ {t("gacha.new")}
                </span>
              ) : (
                <span className="font-pixel text-[11px] text-white/70">{t("gacha.dup", { n: DUP_REFUND })}</span>
              )}
            </div>
          ) : (
            <div className="text-5xl">🎰</div>
          )}
        </div>

        <button
          type="button"
          disabled={!canRoll}
          onClick={roll}
          className={cn(
            "font-pixel w-full rounded py-2.5 text-base font-bold transition-colors",
            canRoll ? "bg-gold text-black hover:brightness-110" : "bg-white/10 text-white/40",
          )}
        >
          {rolling ? "..." : t("gacha.pull", { n: PRICE })}
        </button>
        {wallet < PRICE && !rolling && (
          <p className="font-pixel mt-1 text-center text-[10px] text-white/40">{t("gacha.notEnough")}</p>
        )}
      </DQWindow>

      {/* コレクション（着替え） */}
      <DQWindow title={t("gacha.collection")}>
        <div className="grid grid-cols-3 gap-2">
          {collection.map((c) => {
            const owned = isOwned(c.src);
            const equipped = character === c.src;
            return (
              <button
                key={c.src || "default"}
                type="button"
                disabled={!owned}
                onClick={() => owned && setCharacter(c.src)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded p-1.5 transition-colors",
                  equipped ? "bg-gold/20 ring-1 ring-gold" : owned ? "bg-white/10 hover:bg-white/20" : "bg-white/5",
                )}
              >
                <div className="grid h-12 w-12 place-items-center">
                  {owned ? <Thumb id={c.src} /> : <span className="text-2xl text-white/30">？</span>}
                </div>
                <span className="font-pixel w-full truncate text-center text-[10px] text-white">
                  {owned ? c.name : "？？？"}
                </span>
                {equipped && (
                  <span className="font-pixel text-[9px] font-bold text-gold">{t("costume.equipped")}</span>
                )}
              </button>
            );
          })}
        </div>
      </DQWindow>
    </>
  );
}
