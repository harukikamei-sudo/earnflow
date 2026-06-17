/**
 * トップダウンRPGのタイルマップ定義。
 *
 * マップは1文字=1タイルの文字列配列で表す。
 *   T=木  W=水  G=草  P=道  F=花  S=看板  R=岩  B=建物(バイト先)  D=ドア
 * 木/水/岩/建物/看板は通行不可。ドアと草/道/花は通行可。
 * ドアに接して「けってい」すると労働モードに入る。
 */

export type TileChar = "T" | "W" | "G" | "P" | "F" | "S" | "R" | "B" | "D";

export const TILE = 32; // 1タイルの表示ピクセル

export const MAP: string[] = [
  "TTTTTTTTTTTTTTTT",
  "TGGGGGGGGGGGGGGT",
  "TGGBBBGGGGGGWWWT",
  "TGGBBBGGGGGGWWWT",
  "TGGGDGGGGGGGGWWT",
  "TGGGPGGGGFGGGGGT",
  "TGGGPGGGGGGGRGGT",
  "TGGGPGSGGGGGGGGT",
  "TGGGPGGGGGGGGGGT",
  "TGFGPGGGGGGGGGGT",
  "TGGGGGGGGGGGGGGT",
  "TTTTTTTTTTTTTTTT",
];

export const MAP_W = MAP[0].length;
export const MAP_H = MAP.length;

/** 勇者の初期位置（道の上、ドアを見上げる向き） */
export const SPAWN = { x: 4, y: 9 } as const;

/** バイト先（建物）の左上タイルとサイズ（CSSオーバーレイ描画用） */
export const SHOP = { x: 3, y: 2, w: 3, h: 2 } as const;

const BLOCKING = new Set<string>(["T", "W", "R", "B", "S"]);

export function tileAt(x: number, y: number): TileChar | null {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return null;
  return MAP[y][x] as TileChar;
}

export function isWalkable(x: number, y: number): boolean {
  const t = tileAt(x, y);
  if (t === null) return false;
  return !BLOCKING.has(t);
}

export type Interaction = "work" | "sign" | null;

/** 指定タイルに対する調べる結果（ドア=労働、看板=メッセージ） */
export function interactionAt(x: number, y: number): Interaction {
  const t = tileAt(x, y);
  if (t === "D") return "work";
  if (t === "S") return "sign";
  return null;
}
