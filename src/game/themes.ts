/**
 * ステージテーマ（世界各国の情景）。
 *
 * レベルが上がるごとにステージ全体の配色・地面・装飾がガラッと変わる。
 * 「天候オーバーレイ」ではなく、フィールド自体の見た目を 12 パターンで切り替える。
 * テーマは草/道/水の配色、フィールド背景、装飾(木・花・岩)にかける色フィルタ、
 * 労働シーンの土の色を持つ。
 */

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
}

/** レベル1つのテーマが続く幅（レベル数） */
export const LEVELS_PER_THEME = 3;

export const THEMES: StageTheme[] = [
  {
    id: "japan",
    name: "ニッポン",
    emoji: "🗾",
    bg: "#3f9e44",
    grass: ["#3f9e44", "#43a548"],
    path: ["#caa869", "#c19f60"],
    water: ["#2f6fd0", "#3577da"],
    dirt: "#7a5230",
  },
  {
    id: "italy",
    name: "イタリア",
    emoji: "🇮🇹",
    bg: "#7a8b3a",
    grass: ["#7a8b3a", "#83953f"],
    path: ["#b5552f", "#a84a28"], // レンガ・テラコッタ
    water: ["#2f8fc8", "#3a98d0"],
    objectFilter: "sepia(0.35) saturate(1.2) hue-rotate(-8deg)",
    dirt: "#9b5b34",
  },
  {
    id: "egypt",
    name: "エジプト",
    emoji: "🇪🇬",
    bg: "#d9c08a",
    grass: ["#d9c08a", "#cfb47e"], // 砂漠
    path: ["#c2a062", "#b8965a"],
    water: ["#2fa6c0", "#37afc8"], // オアシス
    objectFilter: "sepia(0.55) saturate(1.3) hue-rotate(-25deg)",
    dirt: "#c2a062",
  },
  {
    id: "nordic",
    name: "ほくおう",
    emoji: "🇳🇴",
    bg: "#e7eef5",
    grass: ["#e7eef5", "#dbe6f0"], // 雪原
    path: ["#b9c6d6", "#aebccd"],
    water: ["#6fa8d8", "#79b1de"],
    objectFilter: "grayscale(0.4) brightness(1.22)",
    dirt: "#aebccd",
  },
  {
    id: "brazil",
    name: "ブラジル",
    emoji: "🇧🇷",
    bg: "#2f8a3a",
    grass: ["#2f8a3a", "#359a40"], // ジャングル
    path: ["#b58a4a", "#aa8042"],
    water: ["#1fae8f", "#26b897"],
    objectFilter: "saturate(1.55) hue-rotate(-8deg)",
    dirt: "#7d5a2c",
  },
  {
    id: "greece",
    name: "ギリシャ",
    emoji: "🇬🇷",
    bg: "#dfe3e8",
    grass: ["#dfe3e8", "#d2d8df"], // 白い石畳の島
    path: ["#c7ccd2", "#bcc2c9"],
    water: ["#1f7fe0", "#2f8fef"], // エーゲ海
    objectFilter: "brightness(0.95) hue-rotate(8deg)",
    dirt: "#b6bcc4",
  },
  {
    id: "china",
    name: "ちゅうごく",
    emoji: "🇨🇳",
    bg: "#4a9a44",
    grass: ["#4a9a44", "#4fa349"],
    path: ["#b23b32", "#a8332b"], // 朱色
    water: ["#2f86c0", "#3790c8"],
    objectFilter: "sepia(0.2) saturate(1.2)",
    dirt: "#8a4a2c",
  },
  {
    id: "france",
    name: "フランス",
    emoji: "🇫🇷",
    bg: "#8a7ad0",
    grass: ["#8a7ad0", "#9384d6"], // ラベンダー畑
    path: ["#9a9aa6", "#8f8f9c"], // 石畳
    water: ["#3f7fd0", "#4a88d6"],
    objectFilter: "hue-rotate(40deg) saturate(1.25)",
    dirt: "#7e7488",
  },
  {
    id: "mexico",
    name: "メキシコ",
    emoji: "🇲🇽",
    bg: "#c2a35a",
    grass: ["#c2a35a", "#b89850"], // 乾いた大地
    path: ["#b5713a", "#aa6833"],
    water: ["#2fb0a0", "#37b9a8"],
    objectFilter: "hue-rotate(-30deg) saturate(1.5)",
    dirt: "#a8632f",
  },
  {
    id: "india",
    name: "インド",
    emoji: "🇮🇳",
    bg: "#cf9a3a",
    grass: ["#cf9a3a", "#c7912f"], // サフラン色の大地
    path: ["#b06a2f", "#a66029"],
    water: ["#2f9fb0", "#37a8b8"],
    objectFilter: "sepia(0.4) hue-rotate(-15deg) saturate(1.35)",
    dirt: "#a8632f",
  },
  {
    id: "russia",
    name: "ロシア",
    emoji: "🇷🇺",
    bg: "#dfe7f0",
    grass: ["#dfe7f0", "#d3dded"], // 雪の都
    path: ["#b3bdcc", "#a8b3c4"],
    water: ["#5f8fc8", "#6998d0"],
    objectFilter: "grayscale(0.3) brightness(1.12)",
    dirt: "#a8b3c4",
  },
  {
    id: "canyon",
    name: "だいきょうこく",
    emoji: "🏜️",
    bg: "#b5613a",
    grass: ["#b5613a", "#aa5832"], // 赤い岩の大峡谷
    path: ["#d39a5a", "#c89152"],
    water: ["#2f8fc8", "#3798d0"],
    objectFilter: "sepia(0.5) hue-rotate(-25deg) saturate(1.3)",
    dirt: "#8a4426",
  },
];

/** レベル → ステージテーマ。LEVELS_PER_THEME ごとに進み、最後で打ち止め。 */
export function themeForLevel(level: number): StageTheme {
  const idx = Math.min(
    THEMES.length - 1,
    Math.floor(Math.max(0, level - 1) / LEVELS_PER_THEME),
  );
  return THEMES[idx];
}
