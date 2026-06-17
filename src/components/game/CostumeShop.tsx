import { PixelImage } from "@/components/pixel/PixelImage";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { HERO_DOWN_A } from "@/components/pixel/sprites";
import { DQWindow } from "@/components/pixel/DQWindow";
import { setCharacter, useAssets, useCharacter } from "@/game/mapStore";
import { buyCostume, isOwned, useOwned, useWallet } from "@/game/playerStore";
import { cn } from "@/lib/utils";

/** コスチューム1着の値段（ゴールド） */
const PRICE = 300;

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}

/**
 * コスチュームショップ。レベルアップで貯めたゴールドでコスチューム（キャラ見た目）を
 * 購入し、装備（= キャラ変更）できる。画像は登録アセットを使う。
 */
export function CostumeShop({ onClose }: { onClose: () => void }) {
  const assets = useAssets();
  const wallet = useWallet();
  useOwned(); // 所持状態の変化で再描画
  const character = useCharacter();

  const costumes = [{ src: "", name: "ドット勇者" }, ...assets.map((s) => ({ src: s, name: basename(s) }))];

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/55 px-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs">
        <DQWindow title="コスチューム" className="anim-dq-pop max-h-[72vh] overflow-y-auto no-scrollbar">
          <div className="mb-2 flex items-center justify-between font-pixel text-sm">
            <span>もちもの</span>
            <span className="text-gold">💰 {wallet} G</span>
          </div>

          <div className="flex flex-col gap-1">
            {costumes.map((c) => {
              const equipped = character === c.src;
              const owned = isOwned(c.src);
              return (
                <div key={c.src || "default"} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center">
                    {c.src ? (
                      <PixelImage src={c.src} style={{ width: 36, height: 36, objectFit: "contain" }} />
                    ) : (
                      <PixelSprite sprite={HERO_DOWN_A} scale={2} />
                    )}
                  </div>
                  <span className="font-pixel flex-1 truncate text-xs text-white">{c.name}</span>

                  {equipped ? (
                    <span className="font-pixel rounded bg-gold/20 px-2 py-1 text-[11px] font-bold text-gold">そうび中</span>
                  ) : owned ? (
                    <button
                      type="button"
                      onClick={() => setCharacter(c.src)}
                      className="font-pixel rounded bg-white/15 px-2 py-1 text-[11px] text-white hover:bg-white/25"
                    >
                      そうびする
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={wallet < PRICE}
                      onClick={() => {
                        if (buyCostume(c.src, PRICE)) setCharacter(c.src);
                      }}
                      className={cn(
                        "font-pixel rounded px-2 py-1 text-[11px] font-bold",
                        wallet < PRICE ? "bg-white/10 text-white/40" : "bg-gold text-black",
                      )}
                    >
                      {PRICE}G で買う
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="font-pixel mt-2 text-[10px] text-white/40">
            ※ レベルアップで💰ゴールドが手に入ります。画像は編集の「画像」から追加できます。
          </p>
          <button type="button" onClick={onClose} className="font-pixel mt-2 w-full rounded bg-white/10 py-1.5 text-xs text-white">
            とじる
          </button>
        </DQWindow>
      </div>
    </div>
  );
}
