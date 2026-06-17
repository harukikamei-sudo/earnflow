import { PixelImage } from "@/components/pixel/PixelImage";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { CHARACTERS, getBuiltinCharacter, HERO_DOWN_A } from "@/components/pixel/sprites";
import { DQWindow } from "@/components/pixel/DQWindow";
import { setCharacter, useAssets, useCharacter } from "@/game/mapStore";
import { buy, isOwned, useOwned, useWallet } from "@/game/playerStore";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** 着せ替え1着の値段（ゴールド） */
const PRICE = 500;

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}

/** 着せ替え1着のサムネイル（組み込みキャラ=スプライト / 画像=PixelImage） */
function CostumeThumb({ id }: { id: string }) {
  if (id === "") return <PixelSprite sprite={HERO_DOWN_A} scale={2} />;
  const builtin = getBuiltinCharacter(id);
  if (builtin) return <PixelSprite sprite={builtin.frames[0]} scale={2} />;
  return <PixelImage src={id} style={{ width: 36, height: 36, objectFit: "contain" }} />;
}

/**
 * 着せ替えパネル（どうぐ屋の店内で使う）。
 * ゴールドを払うと主人公のビジュアルが変わる。いつでも「もとの すがた」に戻せる。
 */
export function CostumePanel() {
  const t = useT();
  const assets = useAssets();
  const wallet = useWallet();
  useOwned(); // 購入で再描画
  const character = useCharacter();

  const costumes = [
    { src: "", name: t("costume.default") },
    ...CHARACTERS.map((c) => ({ src: c.id, name: t(`char.${c.id}`) })),
    ...assets.map((s) => ({ src: s, name: basename(s) })),
  ];

  return (
    <DQWindow title={t("costume.title")}>
      <div className="mb-2 flex items-center justify-between font-pixel text-sm">
        <span>{t("costume.change")}</span>
        <span className="text-gold">💰 {wallet} G</span>
      </div>

      <div className="flex flex-col gap-1">
        {costumes.map((c) => {
          const equipped = character === c.src;
          const owned = isOwned(c.src); // "" は常に所持＝もとの姿に戻せる
          const label = c.src === "" ? t("costume.default") : c.name;
          return (
            <div key={c.src || "default"} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center">
                <CostumeThumb id={c.src} />
              </div>
              <span className="font-pixel flex-1 truncate text-xs text-white">{label}</span>

              {equipped ? (
                <span className="font-pixel rounded bg-gold/20 px-2 py-1 text-[11px] font-bold text-gold">{t("costume.equipped")}</span>
              ) : owned ? (
                <button
                  type="button"
                  onClick={() => setCharacter(c.src)}
                  className="font-pixel rounded bg-white/15 px-2 py-1 text-[11px] text-white hover:bg-white/25"
                >
                  {c.src === "" ? t("costume.revert") : t("costume.equip")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={wallet < PRICE}
                  onClick={() => {
                    if (buy(c.src, PRICE)) setCharacter(c.src);
                  }}
                  className={cn(
                    "font-pixel rounded px-2 py-1 text-[11px] font-bold",
                    wallet < PRICE ? "bg-white/10 text-white/40" : "bg-gold text-black",
                  )}
                >
                  {t("costume.buy", { n: PRICE })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </DQWindow>
  );
}
