import type { HeroDir } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils";

interface TouchControlsProps {
  onPress: (dir: HeroDir) => void;
  onRelease: (dir: HeroDir) => void;
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

/** ドラクエ風の十字キー。スマホのタッチ操作用（移動のみ）。 */
export function TouchControls({ onPress, onRelease }: TouchControlsProps) {
  return (
    <div
      className="absolute z-30 select-none touch-none"
      style={{
        // iPhone のホームインジケータ等（セーフエリア）に被らないよう余白を確保
        left: "max(1.25rem, env(safe-area-inset-left))",
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5" style={{ width: 150, height: 150 }}>
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
  );
}
