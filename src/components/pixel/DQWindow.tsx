import { cn } from "@/lib/utils";

interface DQWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 見出し（任意）。ウィンドウ上辺にタブ風に表示 */
  title?: string;
}

/**
 * ドラクエ風のコマンド/メッセージウィンドウ。
 * 黒地に白の角丸枠（.dq-window）。title を渡すと上部に小見出しを付ける。
 */
export function DQWindow({ title, className, children, ...props }: DQWindowProps) {
  return (
    <div className={cn("dq-window px-4 py-3", className)} {...props}>
      {title && (
        <p className="mb-2 text-[11px] font-bold tracking-[0.2em] text-gold">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/**
 * ドラクエ風のコマンド項目（▶ カーソル + ラベル）。
 * disabled のときは淡色表示。
 */
export function DQCommand({
  label,
  active,
  disabled,
  onClick,
  accent,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** 強調色（はい/いいえ的に主要操作を目立たせる用） */
  accent?: "gold" | "red" | "white";
}) {
  const color =
    accent === "red"
      ? "text-red-400"
      : accent === "gold"
        ? "text-gold"
        : "text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-pixel flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base transition-colors",
        disabled
          ? "cursor-not-allowed text-white/30"
          : "hover:bg-white/10 active:bg-white/15",
        active ? color : disabled ? "" : "text-white",
      )}
    >
      {label}
    </button>
  );
}
