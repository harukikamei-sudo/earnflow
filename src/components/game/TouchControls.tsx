import type { HeroDir } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils";

interface TouchControlsProps {
  onPress: (dir: HeroDir) => void;
  onRelease: (dir: HeroDir) => void;
  onAction: () => void;
  /** けってい ボタンのラベル（状況で「しらべる」等に変える） */
  actionLabel?: string;
}

/** 十字キー1方向ぶんのボタン */
function DirButton({
  dir,
  label,
  onPress,
  onRelease,
  className,
}: {
  dir: HeroDir;
  label: string;
  onPress: (d: HeroDir) => void;
  onRelease: (d: HeroDir) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={dir}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress(dir);
      }}
      onPointerUp={() => onRelease(dir)}
      onPointerCancel={() => onRelease(dir)}
      onPointerLeave={() => onRelease(dir)}
      className={cn(
        "flex items-center justify-center bg-black/70 text-lg text-white ring-1 ring-white/40 active:bg-gold active:text-black",
        className,
      )}
    >
      {label}
    </button>
  );
}

/** ドラクエ風の十字キー＋けってい(○)ボタン。スマホのタッチ操作用。 */
export function TouchControls({ onPress, onRelease, onAction, actionLabel = "けってい" }: TouchControlsProps) {
  return (
    <>
      {/* 十字キー（左下） */}
      <div className="absolute bottom-4 left-4 select-none touch-none">
        <div className="grid grid-cols-3 grid-rows-3 gap-0.5" style={{ width: 132, height: 132 }}>
          <span />
          <DirButton dir="up" label="▲" onPress={onPress} onRelease={onRelease} className="rounded-t-md" />
          <span />
          <DirButton dir="left" label="◀" onPress={onPress} onRelease={onRelease} className="rounded-l-md" />
          <span className="bg-black/40 ring-1 ring-white/20" />
          <DirButton dir="right" label="▶" onPress={onPress} onRelease={onRelease} className="rounded-r-md" />
          <span />
          <DirButton dir="down" label="▼" onPress={onPress} onRelease={onRelease} className="rounded-b-md" />
          <span />
        </div>
      </div>

      {/* けってい（右下） */}
      <div className="absolute bottom-6 right-5 select-none touch-none">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onAction();
          }}
          className="font-pixel grid h-20 w-20 place-items-center rounded-full bg-gold text-sm font-bold text-black shadow-lg ring-2 ring-white/70 active:scale-95"
        >
          {actionLabel}
        </button>
      </div>
    </>
  );
}
