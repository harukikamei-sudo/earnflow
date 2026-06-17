/**
 * レベルに応じたステージ演出（20レベル刻み）。
 *   tier0 (Lv1-19)  : 晴れ（演出なし）
 *   tier1 (Lv20-39) : 霧
 *   tier2 (Lv40-59) : 雨
 *   tier3 (Lv60-79) : 火に包まれる
 *   tier4 (Lv80+)   : 夜（魔界）
 * 画面全体に重ねるオーバーレイ。Overworld と 労働シーンの両方で使う。
 */

import { weatherTier } from "@/game/weather";

const STARS = [
  { l: "14%", t: "12%" },
  { l: "30%", t: "22%" },
  { l: "48%", t: "10%" },
  { l: "66%", t: "20%" },
  { l: "82%", t: "14%" },
  { l: "24%", t: "32%" },
  { l: "72%", t: "34%" },
];

export function WeatherOverlay({ level }: { level: number }) {
  const tier = weatherTier(level);
  if (tier <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {tier === 1 && <div className="anim-fog absolute inset-0" style={{ opacity: 0.32 }} />}

      {tier === 2 && (
        <>
          <div className="absolute inset-0" style={{ background: "rgba(30,45,70,0.32)" }} />
          <div className="anim-rain absolute inset-0" />
        </>
      )}

      {tier === 3 && (
        <>
          <div className="absolute inset-0" style={{ background: "rgba(120,24,0,0.22)" }} />
          <div className="anim-fire absolute inset-x-0 bottom-0 h-2/3" />
        </>
      )}

      {tier >= 4 && (
        <>
          <div className="absolute inset-0" style={{ background: "rgba(20,10,40,0.48)" }} />
          {STARS.map((p, i) => (
            <span
              key={i}
              className="anim-twinkle absolute bg-white"
              style={{ left: p.l, top: p.t, width: 2, height: 2, animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </>
      )}
    </div>
  );
}
