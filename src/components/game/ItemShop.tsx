import { DQWindow } from "@/components/pixel/DQWindow";
import { SHOP_ITEMS } from "@/game/items";
import { buy, isOwned, useOwned, useWallet } from "@/game/playerStore";
import { cn } from "@/lib/utils";

/**
 * どうぐ屋の品ぞろえパネル（店内シーンの中で使う）。
 * レベルアップで貯めたゴールドでアイテム（収入アップ効果）を購入できる。
 */
export function ItemShop() {
  const wallet = useWallet();
  useOwned(); // 購入で再描画

  return (
    <DQWindow title="しなもの">
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

      <p className="font-pixel mt-2 text-[10px] text-white/40">※ アイテムの効果（収入アップ）は所持中ずっと適用されます。</p>
    </DQWindow>
  );
}
