import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Home, Settings } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "ホーム", icon: Home, end: true },
  { to: "/calendar", label: "カレンダー", icon: CalendarDays, end: false },
  { to: "/presets", label: "バイト先", icon: Settings, end: false },
];

/** 認証ページ以外で使うアプリ共通レイアウト（ヘッダー + ボトムナビ） */
export function Layout() {
  const location = useLocation();

  return (
    <div className="bg-app-radial flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-md grid-cols-3">
          {NAV.map(({ to, label, icon: Icon, end }) => {
            const active =
              end
                ? location.pathname === to
                : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_hsl(var(--gold)/0.6)]")} />
                {label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
