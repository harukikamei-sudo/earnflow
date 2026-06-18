/**
 * 日本の休日判定（土日 + 国民の祝日）。
 *
 * 固定祝日・ハッピーマンデー・春分/秋分の日（1980〜2099の近似式）に加え、
 * 振替休日・国民の休日（祝日に挟まれた平日）も判定する。
 * ※ 2019〜2021 のオリンピック等による特例移動は対象外（通常ルールで判定）。
 */

function ymd(date: Date): { y: number; m: number; d: number; w: number } {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), w: date.getDay() };
}

/** その月の第 n 月曜（など）の日付（1始まり）。weekday: 0=日〜6=土 */
function nthWeekday(y: number, m1: number, weekday: number, n: number): number {
  const first = new Date(y, m1 - 1, 1).getDay();
  const offset = (weekday - first + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

/** 春分の日（1980-2099 近似） */
function vernalEquinox(y: number): number {
  return Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
}
/** 秋分の日（1980-2099 近似） */
function autumnEquinox(y: number): number {
  return Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
}

/** 国民の祝日（固定・ハッピーマンデー・春分秋分）の名称。該当なしは null */
function basicHolidayName(date: Date): string | null {
  const { y, m, d } = ymd(date);
  switch (m) {
    case 1:
      if (d === 1) return "元日";
      if (d === nthWeekday(y, 1, 1, 2)) return "成人の日"; // 第2月曜
      break;
    case 2:
      if (d === 11) return "建国記念の日";
      if (d === 23 && y >= 2020) return "天皇誕生日";
      break;
    case 3:
      if (d === vernalEquinox(y)) return "春分の日";
      break;
    case 4:
      if (d === 29) return "昭和の日";
      break;
    case 5:
      if (d === 3) return "憲法記念日";
      if (d === 4) return "みどりの日";
      if (d === 5) return "こどもの日";
      break;
    case 7:
      if (d === nthWeekday(y, 7, 1, 3)) return "海の日"; // 第3月曜
      break;
    case 8:
      if (d === 11 && y >= 2016) return "山の日";
      break;
    case 9:
      if (d === nthWeekday(y, 9, 1, 3)) return "敬老の日"; // 第3月曜
      if (d === autumnEquinox(y)) return "秋分の日";
      break;
    case 10:
      if (d === nthWeekday(y, 10, 1, 2)) return "スポーツの日"; // 第2月曜
      break;
    case 11:
      if (d === 3) return "文化の日";
      if (d === 23) return "勤労感謝の日";
      break;
    case 12:
      if (d === 23 && y <= 2018) return "天皇誕生日"; // 平成
      break;
  }
  return null;
}

const DAY_MS = 86_400_000;
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** 振替休日か（祝日が日曜の場合、直後の平日が休日になる） */
function isSubstitute(date: Date): boolean {
  if (basicHolidayName(date)) return false;
  let cur = new Date(dayStart(date).getTime() - DAY_MS);
  // 直前の連続した祝日をさかのぼり、日曜の祝日に当たれば振替休日
  while (basicHolidayName(cur)) {
    if (cur.getDay() === 0) return true;
    cur = new Date(cur.getTime() - DAY_MS);
  }
  return false;
}

/** 国民の休日か（前後を国民の祝日に挟まれた平日。シルバーウィーク等） */
function isSandwiched(date: Date): boolean {
  if (basicHolidayName(date) || date.getDay() === 0) return false;
  const prev = new Date(dayStart(date).getTime() - DAY_MS);
  const next = new Date(dayStart(date).getTime() + DAY_MS);
  return !!basicHolidayName(prev) && !!basicHolidayName(next);
}

/** 日本の国民の祝日（振替・国民の休日を含む）か */
export function isPublicHoliday(date: Date): boolean {
  return !!basicHolidayName(date) || isSubstitute(date) || isSandwiched(date);
}

/** 祝日名（振替休日・国民の休日も含む）。平日は null */
export function publicHolidayLabel(date: Date): string | null {
  const name = basicHolidayName(date);
  if (name) return name;
  if (isSubstitute(date)) return "振替休日";
  if (isSandwiched(date)) return "国民の休日";
  return null;
}

/** 土日 or 祝日か（休日割増の対象判定） */
export function isHoliday(date: Date): boolean {
  const w = date.getDay();
  return w === 0 || w === 6 || isPublicHoliday(date);
}
