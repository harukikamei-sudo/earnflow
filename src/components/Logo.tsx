import { cn } from "@/lib/utils";

/** 砂時計（時間→金貨）モチーフのロゴマーク */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id="ef-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(45 95% 75%)" />
          <stop offset="0.5" stopColor="hsl(45 90% 58%)" />
          <stop offset="1" stopColor="hsl(38 80% 38%)" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#ef-logo-g)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 12 H46" />
        <path d="M18 52 H46" />
        <path d="M21 12 C21 24 43 28 43 28 C43 28 21 32 21 44 L21 52" />
        <path d="M43 12 C43 24 21 28 21 28 C21 28 43 32 43 44 L43 52" />
      </g>
      <path d="M24 16 H40 L33 27 H31 Z" fill="url(#ef-logo-g)" opacity={0.9} />
      <circle cx="32" cy="44" r="6.5" fill="url(#ef-logo-g)" />
      <text
        x="32"
        y="47.5"
        fontFamily="DM Mono, monospace"
        fontSize="9"
        fontWeight="700"
        textAnchor="middle"
        fill="hsl(240 20% 6%)"
      >
        ¥
      </text>
    </svg>
  );
}

/** ロゴマーク + アプリ名 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <div className="leading-tight">
        <p className="text-sm font-black tracking-tight text-gold-gradient">
          今いくら稼いでる？
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          EarnFlow
        </p>
      </div>
    </div>
  );
}
