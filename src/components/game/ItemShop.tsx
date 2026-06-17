import { DQWindow } from "@/components/pixel/DQWindow";
import { SHOP_ITEMS } from "@/game/items";
import { buy, isOwned, useOwned, useWallet } from "@/game/playerStore";
import { cn } from "@/lib/utils";

/**
 * 道具屋。レベルアップで貯めたゴールドでアイテム（収入アップ効果）を購入できる。
 * 街のショップに近づくと開く。
 */
export function ItemShop({ onClose }: { onClose: () => void }) {
  const wallet = useWallet();
  useOwned(); // 購入で再描画

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/55 px-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs">
        <DQWindow title="どうぐ屋" className="anim-dq-pop max-h-[72vh] overflow-y-auto no-scrollbar">
          <div className="mb-2 flex items-center justify-between font-pixel text-sm">
            <span>いらっしゃい！</span>
            <span className="text-gold">💰 {wallet} G</span>
          </div>

          <div className="flex flex-col gap-1">
            {SHOP_ITEMS.map((item) => {
              const owned = isOwned(item.id);
              const canBuy = wallet >= item.price;
              return (
                <div key={item.id} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1.5">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-pixel text-xs text-white">{item.name}</p>
                    <p className="font-pixel text-[10px] text-gold">{item.desc}</p>
                  </div>
                  {owned ? (
                    <span className="font-pixel rounded bg-gold/20 px-2 py-1 text-[11px] font-bold text-gold">購入済</span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => buy(item.id, item.price)}
                      className={cn(
                        "font-pixel rounded px-2 py-1 text-[11px] font-bold",
                        canBuy ? "bg-gold text-black" : "bg-white/10 text-white/40",
                      )}
                    >
                      {item.price}G
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="font-pixel mt-2 text-[10px] text-white/40">
            ※ アイテムの効果（収入アップ）は所持中ずっと適用されます。
          </p>
          <button type="button" onClick={onClose} className="font-pixel mt-2 w-full rounded bg-white/10 py-1.5 text-xs text-white">
            とじる
          </button>
        </DQWindow>
      </div>
    </div>
  );
}
