/**
 * 進行状況（レベル/所持金/着せ替え/勤務履歴）をリセットして「レベル1から」に戻す。
 * バイト先・目標・マップ編集は残す。実行後にリロードして全ストアを初期化する。
 */
export function resetProgress(): void {
  [
    "earnflow.sessions", // レベル＝累計収入の元
    "earnflow.wallet", // 所持ゴールド
    "earnflow.owned", // 購入済みコスチューム
    "earnflow.activeSession", // 計測中セッション
    "earnflow.character", // 装備中の見た目
  ].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
  // リロード後にタイトルを飛ばして本編（街）へ入るための合図
  try {
    sessionStorage.setItem("earnflow.enter", "1");
  } catch {
    /* ignore */
  }
  location.reload();
}
