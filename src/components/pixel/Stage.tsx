import { useMemo } from "react";
import { PixelAnim, PixelSprite } from "./PixelSprite";
import { PixelImage } from "./PixelImage";
import {
  CLOUD,
  CROWN,
  FLOWER,
  getBuiltinCharacter,
  HERO_FRAMES,
  monsterForLevel,
  ROCK,
  SIGN,
  TREE,
  type Sprite,
} from "./sprites";
import { cn } from "@/lib/utils";

export interface StageCoin {
  id: number;
  amount: number;
}

interface StageProps {
  /** 歩行中（計測中）か */
  walking: boolean;
  level: number;
  /** 時間帯判定用の現在時刻(ms) */
  nowTs: number;
  /** 拾ったコイン演出 */
  coins: StageCoin[];
  /** 割増バフが効いているか */
  buffed?: boolean;
  /** 操作キャラの画像src（空＝既定のドット勇者） */
  characterSrc?: string;
}

type Phase = "dawn" | "day" | "dusk" | "night";

function phaseOf(hour: number): Phase {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

const SKY: Record<Phase, string> = {
  dawn: "linear-gradient(180deg,#f6a86a 0%,#ffd9a8 45%,#cfe8ff 100%)",
  day: "linear-gradient(180deg,#5fb6ff 0%,#a9dcff 60%,#dff3ff 100%)",
  dusk: "linear-gradient(180deg,#3a2a6a 0%,#a05a8a 45%,#ff9e6d 100%)",
  night: "linear-gradient(180deg,#070a24 0%,#141a48 55%,#27306a 100%)",
};

const PHASE_LABEL: Record<Phase, string> = {
  dawn: "あさ",
  day: "ひる",
  dusk: "ゆうがた",
  night: "よる",
};

/** 道ばたに繰り返し並ぶ前景アイテム（地面に立つ） */
function ForegroundStrip({ monster }: { monster: Sprite }) {
  const items: { sprite: Sprite; scale: number; crown?: boolean }[] = [
    { sprite: FLOWER, scale: 4 },
    { sprite: ROCK, scale: 4 },
    { sprite: FLOWER, scale: 4 },
    { sprite: SIGN, scale: 4 },
    { sprite: monster, scale: 4, crown: monsterForLevel(99).sprite === monster },
    { sprite: ROCK, scale: 4 },
    { sprite: FLOWER, scale: 4 },
  ];
  const strip = (
    <div className="flex items-end gap-16 pr-16">
      {items.map((it, i) => (
        <div key={i} className="relative shrink-0">
          {it.crown && (
            <PixelSprite
              sprite={CROWN}
              scale={3}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: "calc(100% - 6px)" }}
            />
          )}
          <PixelSprite sprite={it.sprite} scale={it.scale} />
        </div>
      ))}
    </div>
  );
  return (
    <>
      {strip}
      {strip}
    </>
  );
}

/** 中景の木立 */
function TreeStrip() {
  const strip = (
    <div className="flex items-end gap-24 pr-24">
      {Array.from({ length: 5 }).map((_, i) => (
        <PixelSprite key={i} sprite={TREE} scale={4} className="shrink-0 opacity-90" />
      ))}
    </div>
  );
  return (
    <>
      {strip}
      {strip}
    </>
  );
}

/** 空の雲 */
function CloudStrip() {
  const strip = (
    <div className="flex gap-28 pr-28">
      {[0, 1, 2].map((i) => (
        <PixelSprite
          key={i}
          sprite={CLOUD}
          scale={i === 1 ? 4 : 3}
          className="shrink-0 opacity-80"
          style={{ marginTop: i === 1 ? 6 : i === 2 ? 18 : 0 }}
        />
      ))}
    </div>
  );
  return (
    <>
      {strip}
      {strip}
    </>
  );
}

/**
 * 横スクロールの旅ステージ。
 * walking=true のとき空〜道がスクロールし、勇者が歩行アニメで前進しているように見せる。
 */
export function Stage({ walking, level, nowTs, coins, buffed, characterSrc }: StageProps) {
  const phase = useMemo(() => phaseOf(new Date(nowTs).getHours()), [nowTs]);
  const monster = useMemo(() => monsterForLevel(level), [level]);
  const playState = walking ? "running" : "paused";
  const isNight = phase === "night" || phase === "dusk";

  return (
    <div className="pixel-frame font-pixel relative h-60 w-full overflow-hidden rounded-md bg-black">
      {/* 空 */}
      <div className="absolute inset-0" style={{ background: SKY[phase] }} />

      {/* 星（夜） */}
      {phase === "night" &&
        STAR_POS.map((p, i) => (
          <span
            key={i}
            className="anim-twinkle absolute bg-white"
            style={{ left: p.l, top: p.t, width: 2, height: 2, animationDelay: `${i * 0.3}s` }}
          />
        ))}

      {/* 太陽 / 月 */}
      <div
        className={cn(
          "absolute right-6 top-5 h-9 w-9 rounded-full",
          isNight ? "bg-[#f3f1d6]" : "bg-[#ffe46b]",
        )}
        style={{
          boxShadow: isNight
            ? "0 0 16px 4px rgba(243,241,214,0.45)"
            : "0 0 22px 8px rgba(255,210,80,0.55)",
        }}
      />

      {/* 雲 */}
      <div className="absolute left-0 top-6 w-full">
        <div className="scroller-x" style={{ animationDuration: "60s", animationPlayState: playState }}>
          <CloudStrip />
        </div>
      </div>

      {/* 遠景の丘 */}
      <div className="absolute bottom-14 left-0 w-full">
        <div className="scroller-x" style={{ animationDuration: "34s", animationPlayState: playState }}>
          <HillStrip night={isNight} />
        </div>
      </div>

      {/* 中景の木立 */}
      <div className="absolute bottom-12 left-0 w-full">
        <div className="scroller-x" style={{ animationDuration: "15s", animationPlayState: playState }}>
          <TreeStrip />
        </div>
      </div>

      {/* 地面（草 + 土の道） */}
      <div className="absolute bottom-0 left-0 h-16 w-full">
        <div className="h-3 w-full bg-[#3f9e44]" />
        <div
          className="h-full w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg,#7a5230 0px,#7a5230 10px,#6b4628 10px,#6b4628 20px)",
          }}
        />
      </div>

      {/* 道の流れ（前景：花・岩・看板・モンスター） */}
      <div className="absolute bottom-3 left-0 w-full">
        <div className="scroller-x" style={{ animationDuration: "9s", animationPlayState: playState }}>
          <ForegroundStrip monster={monster.sprite} />
        </div>
      </div>

      {/* 勇者（左寄り・歩行アニメ） */}
      <div className="absolute bottom-[42px] left-[22%]">
        <div className={cn(walking ? "anim-hero-work" : "anim-hero-bob")}>
          {!characterSrc ? (
            <PixelAnim frames={HERO_FRAMES} fps={7} playing={walking} scale={5} />
          ) : getBuiltinCharacter(characterSrc) ? (
            <PixelSprite sprite={getBuiltinCharacter(characterSrc)!} scale={5} />
          ) : (
            <PixelImage src={characterSrc} style={{ height: 80, width: "auto" }} />
          )}
        </div>
        {/* 影 */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-black/35 blur-[1px]" />
      </div>

      {/* 拾ったコイン演出（勇者の上） */}
      <div className="pointer-events-none absolute bottom-[120px] left-[28%]">
        {coins.map((c) => (
          <span
            key={c.id}
            className="anim-coin-rise absolute left-0 top-0 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-xs font-bold text-[#ffe46b] drop-shadow"
          >
            +¥{c.amount.toLocaleString("ja-JP")}
          </span>
        ))}
      </div>

      {/* 左上：時間帯ラベル */}
      <div className="absolute left-2 top-2 rounded bg-black/45 px-2 py-0.5 text-[11px] font-bold text-white">
        {buffed ? "🌙 " : ""}
        {PHASE_LABEL[phase]}・Lv.{level}
      </div>

      {/* 歩行ステータス（右下） */}
      <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white/80">
        {walking ? "▶ あるいている…" : "‖ きゅうけい中"}
      </div>
    </div>
  );
}

/** 遠景の丘（CSS の humps をストリップ化） */
function HillStrip({ night }: { night: boolean }) {
  const color = night ? "#1b3a2a" : "#4fae5a";
  const strip = (
    <div className="flex items-end gap-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 rounded-t-full"
          style={{
            width: 120,
            height: i % 2 === 0 ? 48 : 32,
            background: color,
            marginLeft: i === 0 ? 0 : -24,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
  return (
    <>
      {strip}
      {strip}
    </>
  );
}

const STAR_POS = [
  { l: "12%", t: "12%" },
  { l: "24%", t: "26%" },
  { l: "38%", t: "10%" },
  { l: "52%", t: "22%" },
  { l: "63%", t: "14%" },
  { l: "78%", t: "28%" },
  { l: "88%", t: "12%" },
  { l: "32%", t: "34%" },
];
