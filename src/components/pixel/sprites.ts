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

/* ---------------- 着せ替え（組み込みキャラ・歩行2コマ） ---------------- */

export interface CharacterDef {
  id: string;
  name: string;
  /** 歩行フレーム（2コマ＝歩いて見える / 1コマ＝静止） */
  frames: Sprite[];
}

/** 共通の顔（肌＋目） */
const FACE = ["....oSSSSSSo....", "....oSKSSKSo....", "....oSssssSo...."];

/** 頭+胴(11行) に脚の2コマを付けて歩行スプライトにする */
function walker(headBody: string[], palette: Sprite["palette"]): Sprite[] {
  return [
    { grid: [...headBody, ...HD_LEGS_A], palette },
    { grid: [...headBody, ...HD_LEGS_B], palette },
  ];
}

const HERO_TORSO = [
  "......oooo......",
  ".....oHHHHo.....",
  "....oHHHHHHo....",
  "....oYYYYYYo....",
  ...FACE,
  "...oCCCCCCCCo...",
  "..oSCCYYYYCCSo..",
  "..oSCCCCCCCCSo..",
  "...oCCCCCCCCo...",
];
const WARRIOR_TORSO = [
  "......oooo......",
  ".....oHHHHo.....",
  "....oHHHHHHo....",
  "....oHHHHHHo....",
  ...FACE,
  "...oCCCCCCCCo...",
  "..oSCCCCCCCCSo..",
  "..oSCCCCCCCCSo..",
  "...oCCCCCCCCo...",
];
const PRIEST_TORSO = [
  "......oooo......",
  ".....oWWWWo.....",
  "....oWWWWWWo....",
  "....oWWWWWWo....",
  ...FACE,
  "...oCCCCCCCCo...",
  "..oSCCCCCCCCSo..",
  "..oSCCCCCCCCSo..",
  "...oCCCCCCCCo...",
];
const SUIT_TORSO = [
  "......oooo......",
  ".....oHHHHo.....",
  "....oHHHHHHo....",
  "....oHHHHHHo....",
  ...FACE,
  "...oCCCCCCCCo...",
  "..oSCCWWWWCCSo..",
  "..oSCCWRRWCCSo..",
  "...oCCCCCCCCo...",
];

export const CHARACTERS: CharacterDef[] = [
  {
    id: "char:warrior",
    name: "戦士",
    frames: walker(WARRIOR_TORSO, { o: "#1a1026", H: "#b9bec9", S: "#f3c98b", s: "#d99a5b", K: "#1a1026", C: "#8a8f9e", B: "#5a5f6a", g: "#3a3f4a" }),
  },
  {
    id: "char:priest",
    name: "僧侶",
    frames: walker(PRIEST_TORSO, { o: "#1a1026", W: "#efe9d6", S: "#f3c98b", s: "#d99a5b", K: "#1a1026", C: "#efe9d6", B: "#e0d8bf", g: "#6b4423" }),
  },
  {
    id: "char:hero",
    name: "勇者",
    frames: walker(HERO_TORSO, { o: "#1a1026", H: "#d3d7e2", Y: "#f6c945", S: "#f3c98b", s: "#d99a5b", K: "#1a1026", C: "#3a6ee0", B: "#3a6ee0", g: "#6b4423" }),
  },
  {
    id: "char:salaryman",
    name: "社会人",
    frames: walker(SUIT_TORSO, { o: "#1a1026", H: "#2a2a2a", S: "#f3c98b", s: "#d99a5b", K: "#1a1026", C: "#313a4a", W: "#ececec", R: "#c0392b", B: "#313a4a", g: "#1a1a1a" }),
  },
  {
    id: "char:student",
    name: "学生",
    frames: walker(SUIT_TORSO, { o: "#1a1026", H: "#5a3a22", S: "#f3c98b", s: "#d99a5b", K: "#1a1026", C: "#2f3a6a", W: "#ffffff", R: "#c0392b", B: "#3a3f4a", g: "#2a2a2a" }),
  },
];

/* -------- 自動生成キャラ（職場ロール × 称号で〜360体）。デザインは後で調整可能 -------- */

const ROLE_TORSOS = [HERO_TORSO, WARRIOR_TORSO, PRIEST_TORSO, SUIT_TORSO];
const G_SKINS: [string, string][] = [
  ["#f3c98b", "#d99a5b"],
  ["#e8b07a", "#c98a50"],
  ["#caa06a", "#a87c45"],
  ["#8a5a32", "#6b4423"],
  ["#f7d9b0", "#e0b485"],
];
const G_HAIRS = ["#2a2a2a", "#5a3a22", "#b9bec9", "#d3d7e2", "#efe9d6", "#c0392b", "#3a6ee0", "#8e44ad", "#e67e22", "#1e824c", "#f6c945", "#7f8c8d"];
const G_CLOTHES = ["#3a6ee0", "#c0392b", "#1e824c", "#8e44ad", "#e67e22", "#16a085", "#2c3e50", "#d35400", "#2980b9", "#27ae60", "#c0a020", "#34495e", "#9b59b6", "#e84393", "#0984e3"];
const G_ACCENTS = ["#f6c945", "#ffffff", "#ff7675", "#74b9ff", "#55efc4", "#fdcb6e"];
const G_PANTS = ["#313a4a", "#5a3a22", "#2c3e50", "#3a3f4a", "#4a3520"];
const G_SHOES = ["#1a1a1a", "#3a3f4a", "#6b4423", "#222831"];

const ROLE_TIERS = ["見習い", "駆け出し", "一人前", "中堅", "熟練", "ベテラン", "エース", "カリスマ", "伝説の", "神", "最強の", "究極の"];
const ROLE_NAMES = [
  "新人", "アルバイト", "パートさん", "フリーター", "バイトリーダー", "接客リーダー", "レジ担当",
  "品出し担当", "キッチン担当", "ホール担当", "配達ドライバー", "在庫管理", "シフトリーダー",
  "トレーナー", "副店長", "店長", "主任", "係長", "課長", "次長", "部長", "本部長", "マネージャー",
  "エリアマネージャー", "エリートマネージャー", "スーパーバイザー", "統括マネージャー", "取締役", "社長", "会長",
];

let _rIdx = 0;
for (const role of ROLE_NAMES) {
  for (const tier of ROLE_TIERS) {
    const i = _rIdx++;
    const skin = G_SKINS[(i * 5) % G_SKINS.length];
    const palette: Sprite["palette"] = {
      o: "#1a1026",
      K: "#1a1026",
      S: skin[0],
      s: skin[1],
      H: G_HAIRS[i % G_HAIRS.length],
      W: "#ececec",
      Y: G_ACCENTS[(i * 3) % G_ACCENTS.length],
      C: G_CLOTHES[(i * 7) % G_CLOTHES.length],
      R: "#c0392b",
      B: G_PANTS[(i * 2) % G_PANTS.length],
      g: G_SHOES[i % G_SHOES.length],
    };
    CHARACTERS.push({
      id: `char:role${i}`,
      name: `${tier}${role}`,
      frames: walker(ROLE_TORSOS[i % ROLE_TORSOS.length], palette),
    });
  }
}

const BUILTIN_CHARACTERS: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

/** 組み込みキャラID（"char:warrior" 等）から定義を返す。画像srcの場合は null */
export function getBuiltinCharacter(id: string): CharacterDef | null {
  return BUILTIN_CHARACTERS[id] ?? null;
}

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
