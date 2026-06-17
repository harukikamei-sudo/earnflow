/** レベル → ステージ演出のティア（20レベル刻み）。
 *  0:晴れ / 1:霧 / 2:雨 / 3:炎 / 4:夜 */
export function weatherTier(level: number): number {
  return Math.floor(Math.max(1, level) / 20);
}
