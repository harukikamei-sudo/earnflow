import { useState } from "react";
import { PixelImage } from "@/components/pixel/PixelImage";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { CHARACTERS, getBuiltinCharacter, HERO_DOWN_A, type Rarity } from "@/components/pixel/sprites";
import { DQWindow } from "@/components/pixel/DQWindow";
import { setCharacter, useAssets, useCharacter } from "@/game/mapStore";
import { gachaPull, useOwned, useWallet, type GachaGroup, type GachaResult } from "@/game/playerStore";
import { playSE } from "@/audio/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** ガチャ1回の値段（ダブりでも返金なし） */
const PRICE = 300;
const DUP_REFUND = 0;

/** レア度ごとの排出ウェイト（合計100）。UR=激レア=0.5% */
const RARITY_WEIGHT: Record<Rarity, number> = { N: 60, R: 25, SR: 11, SSR: 3.5, UR: 0.5 };
const RARITY_ORDER: Rarity[] = ["N", "R", "SR", "SSR", "UR"];

/** レア度ごとの見た目（ラベル色・グロー） */
const RARITY_STYLE: Record<Rarity, { label: string; color: string; glow: string; spark: string }> = {
  N: { label: "ノーマル", color: "#cfd3dd", glow: "transparent", spark: "" },
  R: { label: "レア", color: "#74b9ff", glow: "rgba(116,185,255,0.6)", spark: "" },
  SR: { label: "スーパーレア", color: "#b388ff", glow: "rgba(179,136,255,0.7)", spark: "✨" },
  SSR: { label: "SSレア", color: "#f6c945", glow: "rgba(246,201,69,0.8)", spark: "✨✨" },
  UR: { label: "激レア", color: "#ff7675", glow: "rgba(246,201,69,0.95)", spark: "🌈✨" },
};

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
  return getBuiltinCharacter(id)?.name ?? basename(id);
}

/**
 * どうぐ屋のガチャポン。レア度の重み付き抽選（激レア0.5%）でコスチュームが出る。
 * 同じキャラがかぶることもある（ダブりは一部返金）。新規はその場で着用、所持品は着替え可能。
 */
export function GachaPanel() {
  const t = useT();
  const assets = useAssets();
  const wallet = useWallet();
  const ownedIds = useOwned(); // 所持変化で再描画
  const character = useCharacter();

  const [result, setResult] = useState<GachaResult | null>(null);
  const [rolling, setRolling] = useState(false);

  // 全コスチューム（抽選プール）と所持数
  const pool = [...CHARACTERS.map((c) => c.id), ...assets];
  const total = pool.length;
  const got = pool.filter((id) => ownedIds.includes(id)).length;
  const canRoll = wallet >= PRICE && !rolling;

  function roll() {
    if (!canRoll) return;
    setRolling(true);
    setResult(null);
    playSE("confirm");
    window.setTimeout(() => {
      const groups: GachaGroup[] = RARITY_ORDER.map((r) => ({
        rarity: r,
        weight: RARITY_WEIGHT[r],
        ids: CHARACTERS.filter((c) => (c.rarity ?? "N") === r).map((c) => c.id),
      }));
      groups[0].ids.push(...assets); // 追加画像はノーマル枠
      const res = gachaPull(PRICE, groups, DUP_REFUND);
      setRolling(false);
      if (res) {
        setResult(res);
        if (res.isNew) setCharacter(res.id); // 新規は自動で着用
        // SR以上は派手な効果音
        playSE(res.rarity === "SR" || res.rarity === "SSR" || res.rarity === "UR" ? "levelup" : "confirm");
      }
    }, 800);
  }

  const ownedCollection = [
    { src: "", name: t("costume.default") },
    ...pool.filter((id) => ownedIds.includes(id)).map((id) => ({ src: id, name: nameOf(id, t) })),
  ];

  const rs = result ? RARITY_STYLE[(result.rarity as Rarity) ?? "N"] : null;

  return (
    <>
      {/* ガチャ機 */}
      <DQWindow title={t("gacha.title")}>
        <div className="mb-2 flex items-center justify-between font-pixel text-sm">
          <span>{t("gacha.lead")}</span>
          <span className="text-gold">💰 {wallet} G</span>
        </div>

        {/* 結果表示 / カプセル */}
        <div className="mb-3 grid min-h-[140px] place-items-center rounded-md bg-black/30 p-3">
          {rolling ? (
            <div className="anim-hero-bob text-4xl">🥚</div>
          ) : result && rs ? (
            <div className="anim-dq-pop flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn("grid place-items-center rounded-lg p-2", result.rarity === "UR" && "anim-hero-bob")}
                style={{ boxShadow: rs.glow === "transparent" ? undefined : `0 0 18px 4px ${rs.glow}` }}
              >
                <Thumb id={result.id} scale={3} />
              </div>
              <span
                className="font-pixel rounded px-2 py-0.5 text-[11px] font-bold"
                style={{ background: rs.color, color: "#1a1026" }}
              >
                {rs.spark} {rs.label} {rs.spark}
              </span>
              <span className="font-pixel text-sm font-bold text-white">{nameOf(result.id, t)}</span>
              {result.isNew ? (
                <span className="font-pixel rounded bg-gold px-2 py-0.5 text-[11px] font-bold text-black">
                  ✨ {t("gacha.new")}
                </span>
              ) : (
                <span className="font-pixel text-[11px] text-white/70">{t("gacha.dup")}</span>
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

      {/* コレクション（所持分のみ・着替え可） */}
      <DQWindow title={t("gacha.collection")}>
        <p className="font-pixel mb-2 text-xs text-gold">{got} / {total}</p>
        <div className="grid grid-cols-3 gap-2">
          {ownedCollection.map((c) => {
            const equipped = character === c.src;
            return (
              <button
                key={c.src || "default"}
                type="button"
                onClick={() => setCharacter(c.src)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded p-1.5 transition-colors",
                  equipped ? "bg-gold/20 ring-1 ring-gold" : "bg-white/10 hover:bg-white/20",
                )}
              >
                <div className="grid h-12 w-12 place-items-center">
                  <Thumb id={c.src} />
                </div>
                <span className="font-pixel w-full truncate text-center text-[10px] text-white">{c.name}</span>
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
