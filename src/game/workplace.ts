import type { PayType, TimeRule, Workplace } from "@/lib/types";
import { uid } from "@/lib/utils";

/** 時間帯割増ルールを生成（例: 深夜22時〜5時 ×1.25） */
export function makeTimeRule(
  label: string,
  startHour: number,
  endHour: number,
  multiplier: number,
): TimeRule {
  return { id: uid(), label, startHour, endHour, multiplier };
}

/** よく使う割増プリセット */
export const RULE_PRESETS: { label: string; startHour: number; endHour: number; multiplier: number }[] = [
  { label: "深夜割増", startHour: 22, endHour: 5, multiplier: 1.25 },
  { label: "早朝割増", startHour: 5, endHour: 8, multiplier: 1.1 },
  { label: "夕方割増", startHour: 17, endHour: 22, multiplier: 1.15 },
];

/** 名前・給与タイプ・金額・時間帯ルール・休日追加時給から Workplace を生成する */
export function createWorkplace(
  name: string,
  payType: PayType,
  amount: number,
  rules: TimeRule[] = [],
  holidayBonus = 0,
): Workplace {
  return {
    id: uid(),
    name,
    payType,
    hourlyRate: payType === "hourly" ? amount : 0,
    dailyRate: payType === "daily" ? amount : 0,
    monthlyRate: payType === "monthly" ? amount : 0,
    annualRate: payType === "annual" ? amount : 0,
    timeRules: rules,
    holidayBonus: holidayBonus > 0 ? holidayBonus : 0,
    createdAt: Date.now(),
  };
}
