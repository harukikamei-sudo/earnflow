/**
 * ドット絵スプライトのデータ。
 *
 * 各スプライトは「1文字 = 1ピクセル」の文字列配列(grid)と、
 * 文字 → 色 の対応表(palette)で表す。palette に無い文字（`.` 等）は透明。
 * PixelSprite コンポーネントが grid を SVG の矩形に展開して描画する。
 */

export interface Sprite {
  grid: string[];
  palette: Record<string, string>;
}

const HERO_PALETTE: Sprite["palette"] = {
  o: "#1a1026", // 輪郭
  h: "#d3d7e2", // 兜（メタル）
  Y: "#f6c945", // 金トリム
  S: "#f3c98b", // 肌
  s: "#d99a5b", // 肌影
  K: "#1a1026", // 目
  B: "#3a6ee0", // 青チュニック
  g: "#6b4423", // ブーツ
};

/* ---------------- 勇者（歩行 2 コマ） ---------------- */

const HERO_HEAD = [
  "......oooo......",
  ".....ohhhho.....",
  "....ohhhhhho....",
  "....oYYYYYYo....",
  "....oSSSSSSo....",
  "....oSKSSKSo....",
  "....oSSSSSSo....",
  "....oSssssSo....",
  "...oBBBBBBBBo...",
  "..oSBBYYYYBBSo..",
  "..oSBBBBBBBBSo..",
  "..oSBBYYYYBBSo..",
  "...oBBBBBBBBo...",
];

/** 接地コマ（脚を開く） */
export const HERO_A: Sprite = {
  grid: [
    ...HERO_HEAD,
    "...oBBo..oBBo...",
    "..oggo....oggo..",
    "..ooo......ooo..",
  ],
  palette: HERO_PALETTE,
};

/** 抜きコマ（脚をそろえる） */
export const HERO_B: Sprite = {
  grid: [
    ...HERO_HEAD,
    "...oBBo..oBBo...",
    "...oggo..oggo...",
    "...ooo....ooo...",
  ],
  palette: HERO_PALETTE,
};

export const HERO_FRAMES: Sprite[] = [HERO_A, HERO_B];

/* ---------------- 勇者（トップダウン・4方向 × 2コマ） ---------------- */

const HD_HEAD_DOWN = [
  "......oooo......",
  ".....ohhhho.....",
  "....ohhhhhho....",
  "....oYYYYYYo....",
  "....oSSSSSSo....",
  "....oSKSSKSo....",
  "....oSSssSSo....",
];
const HD_HEAD_UP = [
  "......oooo......",
  ".....ohhhho.....",
  "....ohhhhhho....",
  "....ohhhhhho....",
  "....oYYYYYYo....",
  "....ohhhhhho....",
  "....ohhhhhho....",
];
const HD_BODY = [
  "...oBBBBBBBBo...",
  "..oSBBBBBBBBSo..",
  "..oSBBBBBBBBSo..",
  "...oBBBBBBBBo...",
];
const HD_LEGS_A = ["...oBBo..oBBo...", "...oggo..oggo...", "...ooo....ooo..."];
const HD_LEGS_B = ["...oBBo..oBBo...", "..oggo....oggo..", "..ooo......ooo.."];

export const HERO_DOWN_A: Sprite = {
  grid: [...HD_HEAD_DOWN, ...HD_BODY, ...HD_LEGS_A],
  palette: HERO_PALETTE,
};
export const HERO_DOWN_B: Sprite = {
  grid: [...HD_HEAD_DOWN, ...HD_BODY, ...HD_LEGS_B],
  palette: HERO_PALETTE,
};
export const HERO_UP_A: Sprite = {
  grid: [...HD_HEAD_UP, ...HD_BODY, ...HD_LEGS_A],
  palette: HERO_PALETTE,
};
export const HERO_UP_B: Sprite = {
  grid: [...HD_HEAD_UP, ...HD_BODY, ...HD_LEGS_B],
  palette: HERO_PALETTE,
};

export const HERO_SIDE_A: Sprite = {
  grid: [
    ".....oooo.......",
    "....ohhhho......",
    "...ohhhhho......",
    "...oYYYYYo......",
    "..oSSSSo........",
    "..oSKSso........",
    "..oSSSSo........",
    "..oBBBBo........",
    ".oBBBBBBo.......",
    ".oSBBBBo........",
    ".oBBBBBBo.......",
    "..oBBBBo........",
    "..oBo.oBo.......",
    "..ogo.ogo.......",
    "..oo...oo.......",
  ],
  palette: HERO_PALETTE,
};
export const HERO_SIDE_B: Sprite = {
  grid: [
    ".....oooo.......",
    "....ohhhho......",
    "...ohhhhho......",
    "...oYYYYYo......",
    "..oSSSSo........",
    "..oSKSso........",
    "..oSSSSo........",
    "..oBBBBo........",
    ".oBBBBBBo.......",
    ".oSBBBBo........",
    ".oBBBBBBo.......",
    "..oBBBBo........",
    "...oBoBo.......",
    "...ogogo........",
    "...oo.oo.......",
  ],
  palette: HERO_PALETTE,
};

export type HeroDir = "down" | "up" | "left" | "right";

/** 方向 → 歩行2コマ（left/right は side を左右反転して使う） */
export const HERO_TOPDOWN: Record<"down" | "up" | "side", Sprite[]> = {
  down: [HERO_DOWN_A, HERO_DOWN_B],
  up: [HERO_UP_A, HERO_UP_B],
  side: [HERO_SIDE_A, HERO_SIDE_B],
};

/* ---------------- 店主（どうぐ屋のNPC） ---------------- */

export const SHOPKEEPER: Sprite = {
  grid: [
    "......oooo......",
    ".....oHHHHo.....",
    "....oHHHHHHo....",
    "....oSSSSSSo....",
    "....oSKSSKSo....",
    "....oSSssSSo....",
    "...oWWWWWWWWo...",
    "..oSWWAAAAWWSo..",
    "..oSWWAAAAWWSo..",
    "...oWAAAAAAWo...",
    "...oWAAAAAAWo...",
    "...oWWWWWWWWo...",
    "...oppo..oppo...",
    "...oggo..oggo...",
    "...ooo....ooo...",
  ],
  palette: {
    o: "#1a1026",
    H: "#5a3a22", // 髪
    S: "#f3c98b", // 肌
    s: "#d99a5b",
    K: "#1a1026",
    W: "#ececec", // シャツ
    A: "#2f9e44", // 緑エプロン
    p: "#3a3f4a", // ズボン
    g: "#6b4423", // 靴
  },
};

/* ---------------- スライム（共通シルエット・色違いで使い回す） ---------------- */

const SLIME_GRID = [
  ".......oo.......",
  "......ommo......",
  ".....ommmmo.....",
  "....ommhmmmo....",
  "...ommhmmmmmo...",
  "..ommmmmmmmmmo..",
  "..ommmmmmmmmmo..",
  ".ommmmmmmmmmmmo.",
  ".ommWKmmmmWKmmo.",
  ".ommmmmmmmmmmmo.",
  ".ommmKKKKKKmmmo.",
  ".ommmmmmmmmmmmo.",
  "..osmmmmmmmmso..",
  "...oooooooooo...",
];

function slime(palette: Sprite["palette"]): Sprite {
  return { grid: SLIME_GRID, palette };
}

/** 通常スライム（青） */
export const SLIME = slime({
  o: "#0e2742",
  m: "#33a8ea",
  s: "#1d77bd",
  h: "#c6ecff",
  W: "#ffffff",
  K: "#0e2742",
});

/** メタルスライム（銀） */
export const METAL_SLIME = slime({
  o: "#1b1f2a",
  m: "#9aa6b8",
  s: "#6b7689",
  h: "#eef3fb",
  W: "#ffffff",
  K: "#1b1f2a",
});

/** キングスライム（紫・王冠つき） */
export const KING_SLIME = slime({
  o: "#1a0f2e",
  m: "#9a5fe0",
  s: "#6f3fb0",
  h: "#dcc0ff",
  W: "#ffffff",
  K: "#1a0f2e",
});

/* ---------------- 王冠（キングスライム用オーバーレイ） ---------------- */

export const CROWN: Sprite = {
  grid: [
    "...o.o.o.o...",
    "...oYoYoYo...",
    "..oYYYYYYYo..",
    "..oYYWYYWYo..",
    "..ooooooooo..",
  ],
  palette: { o: "#5a3a00", Y: "#f6c945", W: "#fff7d6" },
};

/* ---------------- 金貨 ---------------- */

export const COIN: Sprite = {
  grid: [
    "..oooo..",
    ".oYYYYo.",
    "oYYWWYYo",
    "oYKYYKYo",
    "oYKYYKYo",
    "oYYKKYYo",
    ".oYYYYo.",
    "..oooo..",
  ],
  palette: { o: "#7a4f00", Y: "#f6c945", W: "#fff7d6", K: "#9a6a00" },
};

/* ---------------- 道ばたの風景 ---------------- */

/** 松の木 */
export const TREE: Sprite = {
  grid: [
    "......oo......",
    ".....oggo.....",
    "....ogdggo....",
    "...ogggdggo...",
    "....ogdggo....",
    "...oggdgggo...",
    "..oggdggggo...",
    ".oggggdggggo..",
    "..ogggdgggo...",
    ".oggggdggggo..",
    "oggggggdggggo.",
    ".oggggdggggo..",
    "......bb......",
    "......bb......",
    ".....obbo.....",
    "....oooooo....",
  ],
  palette: { o: "#14331f", g: "#2f9e44", d: "#1f7a33", b: "#6b4423" },
};

/** 岩 */
export const ROCK: Sprite = {
  grid: [
    "...oooo...",
    "..ohhggo..",
    ".ohggggho.",
    "oggggggggo",
    "oggggggggo",
    ".oooooooo.",
  ],
  palette: { o: "#2a2f3a", g: "#8a8f9e", h: "#c9ccd6" },
};

/** 看板（次の目印） */
export const SIGN: Sprite = {
  grid: [
    "oooooooooo",
    "oWWWWWWWWo",
    "oWKWWWWKWo",
    "oWWWWWWWWo",
    "oWKWWWWKWo",
    "oWWWWWWWWo",
    "oooooooooo",
    "....bb....",
    "....bb....",
    "....bb....",
    "....bb....",
    "...oooo...",
  ],
  palette: { o: "#5a3a00", W: "#e8d9a0", K: "#9a7b3a", b: "#6b4423" },
};

/** 花 */
export const FLOWER: Sprite = {
  grid: [
    ".p.p.",
    "pYYYp",
    ".pYp.",
    "..g..",
    "..g..",
  ],
  palette: { p: "#ff6b9d", Y: "#f6c945", g: "#2f9e44" },
};

/** 雲 */
export const CLOUD: Sprite = {
  grid: [
    "....WWWWW....",
    "..WWWWWWWWW..",
    ".WWWWWWWWWWW.",
    "WWWWWWWWWWWWW",
    ".WWWWWWWWWWW.",
  ],
  palette: { W: "#f4f8ff" },
};

/* ---------------- レベルに応じたモンスター ---------------- */

export interface MonsterDef {
  sprite: Sprite;
  crown: boolean;
  name: string;
}

/** レベルに応じて道で出会うモンスターを返す（高レベルほど豪華に） */
export function monsterForLevel(level: number): MonsterDef {
  if (level >= 35) return { sprite: KING_SLIME, crown: true, name: "キングスライム" };
  if (level >= 10) return { sprite: METAL_SLIME, crown: false, name: "メタルスライム" };
  return { sprite: SLIME, crown: false, name: "スライム" };
}
