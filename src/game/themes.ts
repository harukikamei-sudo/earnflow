/**
 * ステージテーマ（世界各国の情景）。
 *
 * レベルが上がるごとにステージ全体の配色・地面・装飾がガラッと変わる。
 * 「天候オーバーレイ」ではなく、フィールド自体の見た目を 12 パターンで切り替える。
 * テーマは草/道/水の配色、フィールド背景、装飾(木・花・岩)にかける色フィルタ、
 * 労働シーンの土の色を持つ。
 */

import { COUNTRIES, type CountryCat } from "./countries";

export interface StageTheme {
  id: string;
  /** 国名（日本語） */
  name: string;
  /** 国旗などの絵文字 */
  emoji: string;
  /** フィールド背景（タイルの隙間や外周に見える地色） */
  bg: string;
  /** 草（市松の2色） */
  grass: [string, string];
  /** 道（市松の2色） */
  path: [string, string];
  /** 水（市松の2色） */
  water: [string, string];
  /** 装飾スプライト(木/花/岩)にかける色フィルタ。地域感を出す */
  objectFilter?: string;
  /** 労働シーンの土の道の色 */
  dirt: string;
  /** ランドマークの種類（TownLandmarkが解釈） */
  landmark: string;
}

/** レベル1つのテーマが続く幅（レベル数）。8ごとに新しい街(国)が開放される */
export const LEVELS_PER_THEME = 8;

/* ---------------- 国カテゴリ → 配色パレット（複数バリエーション）＋既定ランドマーク ---------------- */

interface CatPalette {
  bg: string;
  grass: [string, string];
  path: [string, string];
  water: [string, string];
  dirt: string;
  objectFilter?: string;
}

const CAT_PALETTES: Record<CountryCat, CatPalette[]> = {
  asia: [
    { bg: "#3f9e44", grass: ["#3f9e44", "#43a548"], path: ["#caa869", "#c19f60"], water: ["#2f6fd0", "#3577da"], dirt: "#7a5230" },
    { bg: "#4a9a44", grass: ["#4a9a44", "#4fa349"], path: ["#b23b32", "#a8332b"], water: ["#2f86c0", "#3790c8"], dirt: "#8a4a2c", objectFilter: "sepia(0.2) saturate(1.2)" },
  ],
  tropical: [
    { bg: "#2f8a3a", grass: ["#2f8a3a", "#359a40"], path: ["#b58a4a", "#aa8042"], water: ["#1fae8f", "#26b897"], dirt: "#7d5a2c", objectFilter: "saturate(1.5) hue-rotate(-8deg)" },
    { bg: "#27913f", grass: ["#27913f", "#2ea047"], path: ["#c08a4a", "#b07f40"], water: ["#16b0a0", "#1fbcab"], dirt: "#6b4a26", objectFilter: "saturate(1.6)" },
  ],
  desert: [
    { bg: "#d9c08a", grass: ["#d9c08a", "#cfb47e"], path: ["#c2a062", "#b8965a"], water: ["#2fa6c0", "#37afc8"], dirt: "#c2a062", objectFilter: "sepia(0.5) saturate(1.3) hue-rotate(-25deg)" },
    { bg: "#cf9a3a", grass: ["#cf9a3a", "#c7912f"], path: ["#b06a2f", "#a66029"], water: ["#2f9fb0", "#37a8b8"], dirt: "#a8632f", objectFilter: "sepia(0.4) hue-rotate(-15deg) saturate(1.3)" },
  ],
  snow: [
    { bg: "#e7eef5", grass: ["#e7eef5", "#dbe6f0"], path: ["#b9c6d6", "#aebccd"], water: ["#6fa8d8", "#79b1de"], dirt: "#aebccd", objectFilter: "grayscale(0.4) brightness(1.22)" },
    { bg: "#dfe7f0", grass: ["#dfe7f0", "#d3dded"], path: ["#b3bdcc", "#a8b3c4"], water: ["#5f8fc8", "#6998d0"], dirt: "#a8b3c4", objectFilter: "grayscale(0.3) brightness(1.12)" },
  ],
  europe: [
    { bg: "#5a9e4a", grass: ["#5a9e4a", "#62a851"], path: ["#9a9aa6", "#8f8f9c"], water: ["#3f7fd0", "#4a88d6"], dirt: "#7e7488" },
    { bg: "#6a9c54", grass: ["#6a9c54", "#72a65b"], path: ["#a98b5b", "#9e8252"], water: ["#3a78c8", "#4382d0"], dirt: "#8a6a3a" },
  ],
  med: [
    { bg: "#dfe3e8", grass: ["#dfe3e8", "#d2d8df"], path: ["#c7ccd2", "#bcc2c9"], water: ["#1f7fe0", "#2f8fef"], dirt: "#b6bcc4", objectFilter: "brightness(0.95) hue-rotate(8deg)" },
    { bg: "#e3dccb", grass: ["#e3dccb", "#d8d0bc"], path: ["#cbb98f", "#c0ae83"], water: ["#1f8fe0", "#2f9bef"], dirt: "#b59a6a" },
  ],
  africa: [
    { bg: "#b89a4a", grass: ["#b89a4a", "#ad9043"], path: ["#a8732f", "#9c6a2a"], water: ["#2f9fb0", "#37a8b8"], dirt: "#8a5a2c", objectFilter: "sepia(0.3) saturate(1.3)" },
    { bg: "#c2a35a", grass: ["#c2a35a", "#b89850"], path: ["#a8632f", "#9c5a2a"], water: ["#2fb0a0", "#37b9a8"], dirt: "#8a4a2c", objectFilter: "sepia(0.35) saturate(1.2)" },
  ],
  latin: [
    { bg: "#c2a35a", grass: ["#c2a35a", "#b89850"], path: ["#b5713a", "#aa6833"], water: ["#2fb0a0", "#37b9a8"], dirt: "#a8632f", objectFilter: "hue-rotate(-30deg) saturate(1.5)" },
    { bg: "#b5613a", grass: ["#b5613a", "#aa5832"], path: ["#d39a5a", "#c89152"], water: ["#2f8fc8", "#3798d0"], dirt: "#8a4426", objectFilter: "sepia(0.5) hue-rotate(-25deg) saturate(1.3)" },
  ],
  america: [
    { bg: "#4f9e58", grass: ["#4f9e58", "#57a860"], path: ["#9a9aa6", "#8f8f9c"], water: ["#2f7fd0", "#3788d8"], dirt: "#6b5a3a" },
    { bg: "#5aa84a", grass: ["#5aa84a", "#62b051"], path: ["#b58a4a", "#aa8042"], water: ["#2f86c8", "#3790d0"], dirt: "#7a5230" },
  ],
  oceania: [
    { bg: "#37b0a0", grass: ["#37b0a0", "#3fbaaa"], path: ["#e8d59a", "#dcc98e"], water: ["#1fbfe0", "#2fc9ef"], dirt: "#d8c08a", objectFilter: "saturate(1.4) hue-rotate(-6deg)" },
    { bg: "#2fae8f", grass: ["#2fae8f", "#36b897"], path: ["#e3cf9a", "#d8c48e"], water: ["#22c5d8", "#2fcfe0"], dirt: "#cab584", objectFilter: "saturate(1.5)" },
  ],
  mideast: [
    { bg: "#cbb07a", grass: ["#cbb07a", "#c0a570"], path: ["#b88a4a", "#ad8042"], water: ["#2f9fc0", "#37a8c8"], dirt: "#a87a3a", objectFilter: "sepia(0.4) hue-rotate(-12deg)" },
    { bg: "#d9c08a", grass: ["#d9c08a", "#cfb47e"], path: ["#c2924a", "#b8884a"], water: ["#2fa6c0", "#37afc8"], dirt: "#b07e1e", objectFilter: "sepia(0.45) saturate(1.2)" },
  ],
};

/** カテゴリ既定のランドマーク */
const CAT_LANDMARK: Record<CountryCat, string> = {
  asia: "pagoda",
  tropical: "palm",
  desert: "pyramid",
  snow: "snow",
  europe: "cathedral",
  med: "parthenon",
  africa: "acacia",
  latin: "steppyramid",
  america: "skyscraper",
  oceania: "palm",
  mideast: "dome",
};

/** 国データから全テーマを生成する */
export const THEMES: StageTheme[] = COUNTRIES.map((c, i) => {
  const pals = CAT_PALETTES[c.cat];
  const p = pals[i % pals.length];
  return {
    id: `cty${i}`,
    name: c.name,
    emoji: c.emoji,
    bg: p.bg,
    grass: p.grass,
    path: p.path,
    water: p.water,
    objectFilter: p.objectFilter,
    dirt: p.dirt,
    landmark: c.lm ?? CAT_LANDMARK[c.cat],
  };
});


/** 装飾建物の配置候補（中心の主要建物・水を避けたタイル座標） */
export const DECO_SPOTS = [
  { x: 2, y: 7 }, { x: 6, y: 3 }, { x: 21, y: 4 }, { x: 25, y: 10 },
  { x: 3, y: 18 }, { x: 20, y: 18 }, { x: 24, y: 14 }, { x: 2, y: 11 },
  { x: 8, y: 6 }, { x: 18, y: 6 }, { x: 13, y: 7 }, { x: 22, y: 16 },
];
const BUILD_SPOTS = DECO_SPOTS;
const ROOFS = ["#c0392b", "#2980b9", "#e67e22", "#16a085", "#8e44ad", "#27ae60", "#d35400", "#2c3e50", "#c0a020", "#9b59b6"];

export interface TownBuilding {
  x: number;
  y: number;
  roof: string;
}

/**
 * 町（テーマ）ごとに異なる建物レイアウトを返す。
 * テーマindexで開始位置・間隔・軒数・屋根色を変え、国ごとに配置が変わるようにする。
 */
export function townBuildings(themeIndex: number): TownBuilding[] {
  const n = BUILD_SPOTS.length;
  const offset = (themeIndex * 5) % n;
  const step = 2 + (themeIndex % 3); // 2〜4
  const count = Math.min(n, 9 + (themeIndex % 4)); // 9〜12（賑やかに）
  const used = new Set<number>();
  const out: TownBuilding[] = [];
  for (let k = 0; k < count; k++) {
    const idx = (offset + k * step) % n;
    if (used.has(idx)) continue;
    used.add(idx);
    const s = BUILD_SPOTS[idx];
    out.push({ x: s.x, y: s.y, roof: ROOFS[(themeIndex + k * 3) % ROOFS.length] });
  }
  return out;
}

export interface ResidentHouse {
  id: string;
  x: number;
  y: number;
  roof: string;
  door: { x: number; y: number };
}

/** 派遣住民の家（建物）。住民IDごとに装飾スポットへ配置し、入口を持つ。 */
export function residentHouses(themeIndex: number, ids: string[]): ResidentHouse[] {
  const spots = townBuildings(themeIndex);
  return ids.slice(0, spots.length).map((id, i) => ({
    id,
    x: spots[i].x,
    y: spots[i].y,
    roof: spots[i].roof,
    door: { x: spots[i].x, y: spots[i].y + 1 },
  }));
}

/** 街ごとの「抜け道（門）」の位置候補（左右の端。街ごとに高さが変わる） */
const EXIT_SPOTS = [
  { x: 1, y: 5 }, { x: 26, y: 6 }, { x: 1, y: 9 }, { x: 26, y: 11 },
  { x: 1, y: 14 }, { x: 26, y: 16 }, { x: 1, y: 17 }, { x: 26, y: 4 },
];

/** その街の抜け道（となり街へ抜けられる門）の位置。街ごとに違う場所。 */
export function townExit(themeIndex: number): { x: number; y: number } {
  return EXIT_SPOTS[themeIndex % EXIT_SPOTS.length];
}

/** レベル → 解放済みテーマ（町）の最大インデックス。 */
export function themeIndexForLevel(level: number): number {
  return Math.min(THEMES.length - 1, Math.floor(Math.max(0, level - 1) / LEVELS_PER_THEME));
}

/** レベル → ステージテーマ。LEVELS_PER_THEME ごとに進み、最後で打ち止め。 */
export function themeForLevel(level: number): StageTheme {
  return THEMES[themeIndexForLevel(level)];
}
