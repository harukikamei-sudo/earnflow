import { useEffect, useRef, useState } from "react";
import { setMuted, setVolume } from "@/audio/engine";
import { useAudioPrefs } from "@/audio/useAudio";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * 画面右上の音量ボタン（大きく分かりやすい）。タップでスライダー＆ミュートを開く。
 * 音は Web Audio 経由なので iOS でも音量・ミュートが効く。全シーン共通で表示。
 */
export function VolumeButton() {
  const { volume, muted } = useAudioPrefs();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // パネル外タップで閉じる
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
      className="fixed z-50 select-none"
      style={{
        right: "max(0.5rem, env(safe-area-inset-right))",
        top: "max(0.5rem, env(safe-area-inset-top))",
      }}
    >
      <button
        type="button"
        aria-label={t("audio.volume")}
        onClick={() => setOpen((o) => !o)}
        className="dq-window grid h-12 w-12 place-items-center text-2xl shadow-lg active:scale-95"
      >
        {icon}
      </button>

      {open && (
        <div className="dq-window anim-dq-pop absolute right-0 top-full mt-2 w-52 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-pixel text-xs text-gold">{t("audio.volume")}</span>
            <span className="font-pixel text-xs text-white/70">{pct}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            aria-label={t("audio.volume")}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="h-6 w-full cursor-pointer"
            style={{ accentColor: "#e8b84b" }}
          />
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className={cn(
              "font-pixel mt-3 w-full rounded px-2 py-2 text-sm transition-colors",
              muted ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            {muted ? `🔈 ${t("audio.unmute")}` : `🔇 ${t("audio.mute")}`}
          </button>
        </div>
      )}
    </div>
  );
}
