/**
 * ショップで売るアイテムのカタログ。
 * 各アイテムは「時給(収入)の倍率アップ」効果を持ち、所持していると常時適用される。
 */

export interface ShopItem {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  /** 価格（ゴールド） */
  price: number;
  /** 収入アップ率（例: 0.10 = +10%） */
  boost: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "item.coffee", emoji: "☕", name: "エナジーコーヒー", desc: "収入 +5%", price: 200, boost: 0.05 },
  { id: "item.omamori", emoji: "🧿", name: "しあわせのお守り", desc: "収入 +10%", price: 600, boost: 0.1 },
  { id: "item.glove", emoji: "🧤", name: "はたらきものの手袋", desc: "収入 +15%", price: 1200, boost: 0.15 },
  { id: "item.gold", emoji: "🪙", name: "黄金のお守り", desc: "収入 +25%", price: 3000, boost: 0.25 },
];
