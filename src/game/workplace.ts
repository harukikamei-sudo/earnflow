import type { TimeRule, Workplace } from "@/lib/types";
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

/** 名前・時給・時間帯ルールから Workplace を生成する */
export function createWorkplace(
  name: string,
  hourlyRate: number,
  rules: TimeRule[],
): Workplace {
  return {
    id: uid(),
    name,
    payType: "hourly",
    hourlyRate,
    dailyRate: 0,
    timeRules: rules,
    createdAt: Date.now(),
  };
}
