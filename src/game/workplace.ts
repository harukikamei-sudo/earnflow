import type { Workplace } from "@/lib/types";
import { uid } from "@/lib/utils";

/** 名前・時給・深夜割増から Workplace を生成する */
export function createWorkplace(
  name: string,
  hourlyRate: number,
  nightBonus: boolean,
): Workplace {
  return {
    id: uid(),
    name,
    payType: "hourly",
    hourlyRate,
    dailyRate: 0,
    timeRules: nightBonus
      ? [{ id: "night", label: "深夜割増", startHour: 22, endHour: 5, multiplier: 1.25 }]
      : [],
    createdAt: Date.now(),
  };
}
