/**
 * RPG 風の進行度ロジック（レベル・経験値・称号）。
 *
 * このアプリでは「これまでに稼いだ累計ゴールド（円）」をそのまま経験値(EXP)とみなす。
 * 稼働中はリアルタイムに EXP が増え、しきい値を越えるとレベルアップする。
 *
 * レベル L から L+1 までに必要なゴールド（gap）は `BASE * L` の線形増加。
 * → 序盤はサクサク上がり、レベルが上がるほど必要量が増える典型的な RPG カーブ。
 */

/** レベル 1 つ上げるのに必要なゴールドの基準量（円） */
const BASE_GAP = 300;

export interface LevelInfo {
  /** 現在レベル（1 始まり） */
  level: number;
  /** このレベルに到達するのに必要だった累計ゴールド */
  floor: number;
  /** 次のレベルまでに必要なゴールド量（このレベル区間の幅） */
  gap: number;
  /** このレベル区間で現在どれだけ稼いだか（floor からの差分） */
  into: number;
  /** このレベル区間の達成率（0〜1） */
  progress: number;
  /** 次のレベルまであと何ゴールドか */
  remaining: number;
}

/** 累計ゴールド(EXP)からレベル情報を算出する */
export function levelInfo(totalGold: number): LevelInfo {
  const total = Math.max(0, totalGold);
  let level = 1;
  let floor = 0;
  // レベルは現実的に数百程度までしか上がらないので素朴なループで十分。
  while (level < 100000) {
    const gap = BASE_GAP * level;
    if (total < floor + gap) {
      const into = total - floor;
      return {
        level,
        floor,
        gap,
        into,
        progress: gap > 0 ? into / gap : 0,
        remaining: Math.max(0, gap - into),
      };
    }
    floor += gap;
    level += 1;
  }
  // 理論上ここには来ない（到達したらカンスト扱い）
  return { level, floor, gap: BASE_GAP * level, into: 0, progress: 0, remaining: 0 };
}

export interface RankTitle {
  /** この称号に到達する最小レベル */
  minLevel: number;
  /** 称号名 */
  name: string;
  /** 称号を象徴する絵文字 */
  emoji: string;
}

/** レベル帯ごとの称号テーブル（下のレベルから順に並べる） */
const RANKS: RankTitle[] = [
  { minLevel: 1, name: "見習いワーカー", emoji: "🥚" },
  { minLevel: 5, name: "駆け出しバイター", emoji: "🐣" },
  { minLevel: 10, name: "一人前の稼ぎ手", emoji: "⚔️" },
  { minLevel: 20, name: "熟練ワーカー", emoji: "🛡️" },
  { minLevel: 35, name: "ベテラン戦士", emoji: "🔥" },
  { minLevel: 55, name: "労働マスター", emoji: "👑" },
  { minLevel: 80, name: "伝説の労働者", emoji: "🐉" },
];

/** レベルから称号を返す */
export function rankForLevel(level: number): RankTitle {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
    else break;
  }
  return current;
}
