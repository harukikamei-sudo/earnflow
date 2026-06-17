/**
 * トップダウンRPGのタイルマップ定義。
 *
 * タイル種別:
 *   T=木  W=水  G=草  P=道  F=花  S=看板  R=岩  B=建物(バイト先)  D=ドア
 * 木/水/岩/建物/看板は通行不可。ドア・草・道・花は通行可。
 * バイト先(ドア)に近づくと選択肢が出て、労働モードに入れる。
 *
 * マップは手打ちミスを避けるためコードで生成する。
 */

export type TileChar = "T" | "W" | "G" | "P" | "F" | "S" | "R" | "B" | "D";

export const TILE = 32; // 1タイルの表示ピクセル
export const MAP_W = 28;
export const MAP_H = 20;

/** バイト先（建物）の左上タイルとサイズ */
export const SHOP = { x: 10, y: 3, w: 3, h: 2 } as const;
/** バイト先のドア（ここに近づくと労働の選択肢が出る） */
export const DOOR = { x: 11, y: 5 } as const;
/** 看板（近づくと説明が出る） */
export const SIGN_POS = { x: 12, y: 14 } as const;
/** 勇者の初期位置 */
export const SPAWN = { x: 11, y: 15 } as const;

function buildMap(): string[] {
  const g: TileChar[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => "G" as TileChar),
  );
  const set = (x: number, y: number, t: TileChar) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) g[y][x] = t;
  };

  // 外周の木
  for (let x = 0; x < MAP_W; x++) {
    set(x, 0, "T");
    set(x, MAP_H - 1, "T");
  }
  for (let y = 0; y < MAP_H; y++) {
    set(0, y, "T");
    set(MAP_W - 1, y, "T");
  }

  // 森のかたまり
  const forest: [number, number][] = [
    [3, 2], [4, 2], [3, 3], [18, 2], [19, 2], [19, 3], [2, 13], [3, 13],
    [20, 14], [21, 14], [21, 15], [6, 5], [5, 6], [17, 16], [18, 16],
    [24, 3], [25, 3], [24, 4], [25, 12], [26, 12], [5, 17], [6, 17],
    [23, 17], [24, 17], [25, 17], [9, 16], [10, 17],
  ];
  forest.forEach(([x, y]) => set(x, y, "T"));

  // 池
  for (let y = 9; y <= 12; y++) for (let x = 3; x <= 7; x++) set(x, y, "W");
  for (let y = 6; y <= 8; y++) for (let x = 22; x <= 25; x++) set(x, y, "W");

  // バイト先（建物）とドア
  for (let y = SHOP.y; y < SHOP.y + SHOP.h; y++)
    for (let x = SHOP.x; x < SHOP.x + SHOP.w; x++) set(x, y, "B");
  set(DOOR.x, DOOR.y, "D");

  // 道（縦：ドア下〜スポーン、横：十字路）
  for (let y = DOOR.y + 1; y <= SPAWN.y; y++) set(DOOR.x, y, "P");
  for (let x = 8; x <= 16; x++) set(x, 12, "P");

  // 看板
  set(SIGN_POS.x, SIGN_POS.y, "S");

  // 花・岩（草の上だけ）
  const flowers: [number, number][] = [
    [2, 5], [20, 6], [8, 8], [16, 9], [14, 16], [8, 15], [9, 3],
    [22, 11], [25, 16], [19, 18], [13, 18], [3, 16],
  ];
  flowers.forEach(([x, y]) => g[y][x] === "G" && set(x, y, "F"));
  const rocks: [number, number][] = [[15, 4], [20, 10], [7, 16], [16, 6], [24, 14], [11, 18]];
  rocks.forEach(([x, y]) => g[y][x] === "G" && set(x, y, "R"));

  return g.map((r) => r.join(""));
}

export const MAP: string[] = buildMap();

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
