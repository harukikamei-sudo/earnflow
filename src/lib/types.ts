/**
 * EarnFlow データモデル
 *
 * オリジナル（Base44 版）のエンティティに相当する型をローカルで定義。
 * 永続化は src/lib/store.ts（localStorage）が担当する。
 * バックエンドに差し替える場合は store.ts の実装だけを置き換えればよい。
 */

export type PayType = "hourly" | "daily";

/** 時間帯別の割増ルール（例: 深夜22時〜翌5時は 1.25 倍） */
export interface TimeRule {
  id: string;
  /** 表示ラベル（例: "深夜割増"） */
  label: string;
  /** 開始時刻（0-23 時） */
  startHour: number;
  /** 終了時刻（0-23 時, startHour をまたいで翌日になる場合あり） */
  endHour: number;
  /** 倍率（例: 1.25） */
  multiplier: number;
}

/** バイト先 */
export interface Workplace {
  id: string;
  name: string;
  payType: PayType;
  /** 時給（円）— payType === "hourly" のとき使用 */
  hourlyRate: number;
  /** 日給（円）— payType === "daily" のとき使用 */
  dailyRate: number;
  /** 時間帯別倍率ルール */
  timeRules: TimeRule[];
  /** テーマカラー（任意・将来のラベル色分け用） */
  color?: string;
  createdAt: number;
}

/** 勤務セッション（1 回の稼働記録） */
export interface Session {
  id: string;
  workplaceId: string;
  /** 開始時刻（epoch ms） */
  startTime: number;
  /** 終了時刻（epoch ms） */
  endTime: number;
  /** 稼働秒数 */
  durationSec: number;
  /** 確定収入（円） */
  earnings: number;
  /** 記録日（YYYY-MM-DD, ローカル基準） */
  dateKey: string;
}

/** 目標設定 */
export interface Goal {
  /** 月目標額（円）。未設定は 0 */
  monthlyTarget: number;
  /** 年目標額（円）。未設定は 0 */
  yearlyTarget: number;
  /** 月の出勤日数（逆算用） */
  workDaysPerMonth: number;
}

/** クライアント側のモックユーザー（後で本物の認証に差し替え） */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}
