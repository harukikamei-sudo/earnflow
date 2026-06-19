/**
 * トップダウンRPGのタイルマップ定義（既定値）と定数。
 *
 * タイル種別:
 *   T=木  W=水  G=草  P=道  F=花  S=看板  R=岩  B=建物(バイト先)  D=ドア  C=城
 * 木/水/岩/建物/看板/城は通行不可。ドア・草・道・花は通行可。
 *
 * 実際にゲームが参照する「現在のマップ」は mapStore が保持する（編集モードで上書き可能）。
 * ここでは既定マップ DEFAULT_MAP と、座標やサイズなどの定数だけを定義する。
 */

export type TileChar = "T" | "W" | "G" | "P" | "F" | "S" | "R" | "B" | "D" | "C" | "N";

/** 既定ステージ（まち）のID */
export const TOWN_ID = "town";

/** 真っ白なステージのタイル行を作る（新ステージ用） */
export function blankRows(): string[] {
  return Array.from({ length: MAP_H }, () => "N".repeat(MAP_W));
}

export const TILE = 32; // 1タイルの表示ピクセル
export const MAP_W = 28;
export const MAP_H = 20;

/** バイト先（建物）の左上タイルとサイズ */
export const SHOP = { x: 10, y: 3, w: 3, h: 2 } as const;
/** バイト先のドア（ここに近づくと労働の選択肢が出る） */
export const DOOR = { x: 11, y: 5 } as const;
/** 城（街のランドマーク。イラストを上に重ねて描画） */
export const CASTLE = { x: 19, y: 1, w: 7, h: 5 } as const;
/** どうぐ屋（街のランドマーク。近づくとアイテム購入）。タイルではなく重ね描画 */
export const MARKET = { x: 15, y: 8, w: 3, h: 2 } as const;
/** どうぐ屋の入口（接近判定の中心） */
export const MARKET_DOOR = { x: 16, y: 10 } as const;
/** 看板（近づくと説明が出る） */
export const SIGN_POS = { x: 12, y: 14 } as const;
/** わが家（看板の下。近づくと中に入れる＝カレンダー/ノルマ確認）。重ね描画 */
export const HOUSE = { x: 11, y: 17, w: 3, h: 2 } as const;
/** わが家の入口（接近判定の中心。看板の下） */
export const HOUSE_DOOR = { x: 12, y: 16 } as const;
/** 勇者の初期位置 */
export const SPAWN = { x: 11, y: 15 } as const;

function buildMap(): string[] {
  const g: TileChar[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => "G" as TileChar),
  );
  const set = (x: number, y: number, t: TileChar) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) g[y][x] = t;
  };

  for (let x = 0; x < MAP_W; x++) {
    set(x, 0, "T");
    set(x, MAP_H - 1, "T");
  }
  for (let y = 0; y < MAP_H; y++) {
    set(0, y, "T");
    set(MAP_W - 1, y, "T");
  }

  const forest: [number, number][] = [
    [3, 2], [4, 2], [3, 3], [18, 2], [19, 2], [19, 3], [2, 13], [3, 13],
    [20, 14], [21, 14], [21, 15], [6, 5], [5, 6], [17, 16], [18, 16],
    [24, 3], [25, 3], [24, 4], [25, 12], [26, 12], [5, 17], [6, 17],
    [23, 17], [24, 17], [25, 17], [9, 16], [10, 17],
  ];
  forest.forEach(([x, y]) => set(x, y, "T"));

  for (let y = 9; y <= 12; y++) for (let x = 3; x <= 7; x++) set(x, y, "W");
  for (let y = 6; y <= 8; y++) for (let x = 22; x <= 25; x++) set(x, y, "W");

  // 建物(バイト先/道具屋/我が家)は町ごとに位置が変わるオーバーレイなので、
  // 当たり判定タイルは置かない（自由に歩ける）。看板だけタイルに置く。
  set(SIGN_POS.x, SIGN_POS.y, "S");

  const flowers: [number, number][] = [
    [2, 5], [20, 6], [8, 8], [16, 9], [14, 16], [8, 15], [9, 3],
    [22, 11], [25, 16], [19, 18], [13, 18], [3, 16],
  ];
  flowers.forEach(([x, y]) => g[y][x] === "G" && set(x, y, "F"));
  const rocks: [number, number][] = [[15, 4], [20, 10], [7, 16], [16, 6], [24, 14], [11, 18]];
  rocks.forEach(([x, y]) => g[y][x] === "G" && set(x, y, "R"));

  return g.map((r) => r.join(""));
}

export const DEFAULT_MAP: string[] = buildMap();

/* ---------------- 町ごとの建物レイアウト ---------------- */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface TownLayout {
  shop: Rect;
  market: Rect;
  house: Rect;
  shopDoor: { x: number; y: number };
  marketDoor: { x: number; y: number };
  houseDoor: { x: number; y: number };
}

const BSIZE = { w: 3, h: 2 };
/** 町ごとの建物配置テンプレ（先頭=従来の配置）。テーマindexで巡回。 */
const LAYOUT_TEMPLATES: { shop: XY; market: XY; house: XY }[] = [
  { shop: { x: 10, y: 3 }, market: { x: 15, y: 8 }, house: { x: 11, y: 17 } },
  { shop: { x: 3, y: 4 }, market: { x: 20, y: 12 }, house: { x: 18, y: 3 } },
  { shop: { x: 18, y: 11 }, market: { x: 4, y: 6 }, house: { x: 12, y: 3 } },
  { shop: { x: 11, y: 11 }, market: { x: 17, y: 4 }, house: { x: 4, y: 13 } },
  { shop: { x: 20, y: 13 }, market: { x: 8, y: 12 }, house: { x: 14, y: 3 } },
  { shop: { x: 14, y: 9 }, market: { x: 3, y: 15 }, house: { x: 21, y: 11 } },
];

type XY = { x: number; y: number };
const rectOf = (b: XY): Rect => ({ x: b.x, y: b.y, w: BSIZE.w, h: BSIZE.h });
/** 入口（ドア）の位置。下に余裕があれば建物の下、無ければ上に置く */
const doorOf = (b: XY): XY => {
  const below = b.y + BSIZE.h;
  return { x: b.x + 1, y: below <= MAP_H - 2 ? below : b.y - 1 };
};

/** 町（テーマ）ごとの建物レイアウトを返す。機能は同じで配置だけ変わる。 */
export function townLayout(themeIndex: number): TownLayout {
  const i = ((themeIndex % LAYOUT_TEMPLATES.length) + LAYOUT_TEMPLATES.length) % LAYOUT_TEMPLATES.length;
  const tpl = LAYOUT_TEMPLATES[i];
  return {
    shop: rectOf(tpl.shop),
    market: rectOf(tpl.market),
    house: rectOf(tpl.house),
    shopDoor: doorOf(tpl.shop),
    marketDoor: doorOf(tpl.market),
    houseDoor: doorOf(tpl.house),
  };
}

const BLOCKING = new Set<string>(["T", "W", "R", "B", "S"]);

/** そのタイル文字が通行不可か */
export function isBlocking(ch: string | null): boolean {
  return ch === null || BLOCKING.has(ch);
}
