import { useEffect, useRef, useState } from "react";
import { setMuted, setVolume, toggleMuted } from "@/audio/engine";
import { useAudioPrefs } from "@/audio/useAudio";
import { useT } from "@/i18n";

/**
 * 画面上の音量コントロール（スピーカーボタン＋スライダー）。
 * Home の全シーンに重ねて常時表示する。右下に配置（左下の十字キーと干渉しない）。
 */
export function AudioControl() {
  const { volume, muted } = useAudioPrefs();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // パネル外をタップしたら閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const effective = muted ? 0 : volume;
  const icon = effective <= 0 ? "🔇" : effective < 0.5 ? "🔉" : "🔊";
  const pct = Math.round(effective * 100);

  return (
    <div
      ref={ref}
      className="absolute z-40 select-none"
      style={{
        right: "max(0.5rem, env(safe-area-inset-right))",
        bottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {open && (
        <div className="dq-window anim-dq-pop absolute bottom-full right-0 mb-2 w-44 px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-pixel text-[11px] text-gold">{t("audio.volume")}</span>
            <span className="font-pixel text-[11px] text-white/70">{pct}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            aria-label={t("audio.volume")}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-full cursor-pointer"
            style={{ accentColor: "#e8b84b" }}
          />
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="font-pixel mt-2 w-full rounded bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
          >
            {muted ? t("audio.unmute") : t("audio.mute")}
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label={t("audio.volume")}
        title={t("audio.volume")}
        onClick={() => setOpen((o) => !o)}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleMuted();
        }}
        className="dq-window grid h-9 w-9 place-items-center text-base active:scale-95"
      >
        {icon}
      </button>
    </div>
  );
}
